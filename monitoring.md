# Monitoring — Plateforme Médicale LEONI

Documentation complète du fichier `.github/workflows/monitoring.yml`.

---

## Déclenchement

Le workflow de monitoring se lance de deux façons :

| Déclencheur | Condition |
|-------------|-----------|
| **Automatique** | À la fin de chaque exécution réussie du workflow `Deploy Medical Project` (push sur `main`) |
| **Manuel** | Via l'onglet *Actions* → *Monitoring - CloudWatch & CloudTrail* → *Run workflow* (avec possibilité de saisir une IP cible) |

Il s'exécute **en parallèle du DAST** : les deux workflows sont déclenchés par la même fin de déploiement et tournent simultanément.

```
Push sur main
    └── Deploy Medical Project (Jobs 1→4)
              └── [terminé avec succès]
                       ├── DAST (tests de sécurité dynamiques)
                       └── Monitoring (CloudWatch + CloudTrail)  ← concurrent
```

---

## Architecture des jobs

```
Phase 0 : prepare
    │
    ├── Phase 1 : cloudwatch-agent   (SSH vers EC2)
    │
    ├── Phase 3 : cloudtrail         (AWS CLI depuis le runner)
    │
    ├── Phase 2 : cloudwatch-alarms  (après Phase 1)
    │       └── alarmes + SNS + rétention logs
    │
    ├── Phase 4 : dashboard          (après Phase 2)
    │
    └── Phase 5 : report             (toujours, résumé final)
```

---

## Phase 0 — Préparation

**But :** Récupérer les identifiants nécessaires aux phases suivantes.

| Information | Source | Utilisation |
|-------------|--------|-------------|
| `target_ip` | `terraform/terraform.tfstate` ou saisie manuelle | Adresse SSH de l'instance EC2 |
| `instance_id` | `aws ec2 describe-instances` (tag `medical-app-server`) | Dimension CloudWatch des métriques |
| `account_id` | `aws sts get-caller-identity` | Construction des ARN SNS, S3, CloudTrail |

Si aucune IP n'est trouvée (pas de tfstate, pas de saisie manuelle), le job échoue et stoppe le pipeline de monitoring.

---

## Phase 1 — CloudWatch Agent & Health Check HTTP

**But :** Installer et configurer l'agent CloudWatch sur l'instance EC2, puis déployer un health check applicatif tournant en cron.

### 1.1 Installation de l'agent

L'agent officiel AWS est téléchargé depuis `s3.amazonaws.com/amazoncloudwatch-agent` et installé via `dpkg`. Si l'agent est déjà présent, cette étape est ignorée.

### 1.2 Métriques système collectées

Toutes les métriques sont publiées dans le namespace **`MedicalApp/System`** avec la dimension `InstanceId`.  
Fréquence de collecte : **toutes les 60 secondes**.

#### CPU
| Métrique | Description |
|----------|-------------|
| `cpu_usage_idle` | Pourcentage de temps CPU inactif |
| `cpu_usage_user` | Temps CPU consommé par les processus utilisateur (Gunicorn, npm…) |
| `cpu_usage_system` | Temps CPU consommé par le noyau |
| `cpu_usage_iowait` | Temps CPU en attente d'opérations disque (MySQL, fichiers) |

`totalcpu: true` → une métrique globale toutes CPUs confondues est ajoutée.

#### Mémoire
| Métrique | Description |
|----------|-------------|
| `mem_used_percent` | Pourcentage de mémoire RAM utilisée |
| `mem_available_percent` | Pourcentage de mémoire disponible |
| `mem_used` | Mémoire utilisée en octets |
| `mem_total` | Mémoire totale en octets |

> La mémoire n'est **pas** collectée nativement par EC2 — elle nécessite l'agent CloudWatch.

#### Disque
| Métrique | Description |
|----------|-------------|
| `disk_used_percent` | Pourcentage d'espace utilisé sur `/` |
| `inodes_free` | Nombre d'inodes libres |
| `disk_free` | Espace libre en octets |

Dimensions supplémentaires envoyées par l'agent : `path=/`, `device` (ex: `nvme0n1p1`), `fstype` (ex: `ext4`).

#### Disk I/O
| Métrique | Description |
|----------|-------------|
| `diskio_reads` | Nombre d'opérations de lecture par minute |
| `diskio_writes` | Nombre d'opérations d'écriture par minute |
| `diskio_read_bytes` | Octets lus par minute |
| `diskio_write_bytes` | Octets écrits par minute |
| `diskio_iops_in_progress` | Opérations I/O en attente (indicateur de saturation) |

#### Réseau
| Métrique | Description |
|----------|-------------|
| `net_bytes_recv` | Octets reçus par minute (interface `eth0`) |
| `net_bytes_sent` | Octets émis par minute |
| `net_packets_recv` | Paquets reçus |
| `net_packets_sent` | Paquets émis |
| `net_err_in` | Erreurs réseau en réception |
| `net_err_out` | Erreurs réseau en émission |

#### Swap
| Métrique | Description |
|----------|-------------|
| `swap_used_percent` | Pourcentage d'espace swap utilisé |

Un swap élevé indique une mémoire RAM insuffisante et des performances dégradées.

#### Processus
| Métrique | Description |
|----------|-------------|
| `processes_running` | Processus actifs en ce moment |
| `processes_sleeping` | Processus en attente (état normal) |
| `processes_dead` | Processus morts (problème potentiel) |

---

### 1.3 Logs centralisés dans CloudWatch Logs

L'agent collecte les fichiers de log suivants et les envoie dans des groupes de logs dédiés :

| Fichier sur l'instance | Groupe CloudWatch Logs | Contenu |
|------------------------|------------------------|---------|
| `/var/log/gunicorn-access.log` | `/medical-app/gunicorn/access` | Toutes les requêtes HTTP reçues par Django |
| `/var/log/gunicorn-error.log` | `/medical-app/gunicorn/errors` | Erreurs Python, exceptions, stack traces |
| `/var/log/nginx/access.log` | `/medical-app/nginx/access` | Requêtes HTTP vers le frontend React |
| `/var/log/nginx/error.log` | `/medical-app/nginx/errors` | Erreurs nginx (502, timeout proxy…) |
| `/var/log/mysql/error.log` | `/medical-app/mysql/errors` | Erreurs MySQL, connexions refusées |
| `/tmp/backend.log` | `/medical-app/django/runtime` | Logs Django en temps réel (runserver) |
| `/var/log/medical-bootstrap.log` | `/medical-app/bootstrap` | Log du premier démarrage de l'instance EC2 |

Chaque log est associé à un `log_stream_name` basé sur l'`instance_id`.  
Intervalle d'envoi : **30 secondes** (`force_flush_interval`).

---

### 1.4 Credentials AWS pour l'agent

L'agent CloudWatch a besoin de credentials AWS pour écrire les métriques et les logs.  
Un fichier `/root/.aws/credentials` est généré sur l'instance avec deux profils :

- `[default]` → utilisé par l'AWS CLI (health check, alarme disque)
- `[AmazonCloudWatchAgent]` → utilisé par l'agent lui-même

Les credentials proviennent des secrets GitHub (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`).

> **Limite Learner Lab :** les credentials AWS expirent à la fin de chaque session de lab. L'agent doit être reconfiguré à chaque nouveau déploiement pour mettre à jour les credentials.

---

### 1.5 Health Check HTTP (cron toutes les 5 minutes)

Un script `/opt/healthcheck/healthcheck.sh` est déployé sur l'instance et exécuté automatiquement via `/etc/cron.d/medical-healthcheck`.

**Ce qu'il vérifie :**

| Vérification | Méthode | Résultat |
|--------------|---------|----------|
| Frontend React | `curl http://localhost/ → HTTP 200` | `FrontendHealthy = 1` (OK) ou `0` (DOWN) |
| API Django | `curl http://localhost:8000/api/account/login/ → HTTP 200` | `ApiHealthy = 1` ou `0` |
| MySQL | `systemctl is-active mysql` | `MysqlHealthy = 1` ou `0` |
| Application globale | `FrontendHealthy AND ApiHealthy AND MysqlHealthy` | `AppHealthy = 1` ou `0` |

Les 4 métriques sont publiées dans le namespace **`MedicalApp/Application`** avec la dimension `InstanceId`.  
Fréquence : **toutes les 5 minutes**.

### 1.6 Alarme disque (créée depuis l'instance)

L'alarme sur l'utilisation du disque nécessite les dimensions exactes que l'agent envoie (`device`, `fstype`). Ces valeurs variant selon le type d'instance EC2, le script `disk_alarm.sh` les détecte dynamiquement sur l'instance :

```bash
DISK_DEVICE=$(df --output=source / | tail -1 | sed 's|/dev/||')   # ex: nvme0n1p1
DISK_FSTYPE=$(df --output=fstype / | tail -1)                     # ex: ext4
```

L'alarme est ensuite créée depuis l'instance avec les bonnes dimensions.

---

## Phase 2 — Alarmes CloudWatch + SNS + Rétention

### 2.1 Topic SNS et notifications email

Un topic SNS `medical-app-alerts` est créé. Toutes les alarmes y sont connectées.  
Une souscription email est ajoutée vers l'adresse configurée dans le secret `SNS_ALERT_EMAIL`.

> **Action requise :** Après le premier déclenchement, AWS envoie un **email de confirmation** à l'adresse configurée. Il faut cliquer sur le lien dans cet email pour activer les notifications. Sans cette confirmation, aucune alerte ne sera envoyée.

### 2.2 Alarmes configurées

#### Alarmes système

| Nom | Métrique | Namespace | Seuil | Évaluation | Notification |
|-----|----------|-----------|-------|------------|--------------|
| `medical-app-cpu-high` | `CPUUtilization` | `AWS/EC2` | > 80 % | 1 période de 5 min | Email + OK retour |
| `medical-app-memory-high` | `mem_used_percent` | `MedicalApp/System` | > 85 % | 1 période de 5 min | Email + OK retour |
| `medical-app-disk-high` | `disk_used_percent` | `MedicalApp/System` | > 85 % | 1 période de 5 min | Email + OK retour |
| `medical-app-instance-check` | `StatusCheckFailed` | `AWS/EC2` | ≥ 1 | 2 périodes de 1 min | Email (pas de OK) |

#### Alarmes application

| Nom | Métrique | Namespace | Condition | Évaluation |
|-----|----------|-----------|-----------|------------|
| `medical-app-health-global` | `AppHealthy` | `MedicalApp/Application` | < 1 (DOWN) | 2 périodes de 5 min |
| `medical-app-frontend-down` | `FrontendHealthy` | `MedicalApp/Application` | < 1 (DOWN) | 2 périodes de 5 min |
| `medical-app-api-down` | `ApiHealthy` | `MedicalApp/Application` | < 1 (DOWN) | 2 périodes de 5 min |
| `medical-app-mysql-down` | `MysqlHealthy` | `MedicalApp/Application` | < 1 (DOWN) | 2 périodes de 5 min |

Toutes les alarmes applicatives envoient une notification au retour à l'état OK (`ok-actions`).

**Comportement `treat-missing-data` :**
- `notBreaching` (CPU, mémoire, disque) → si aucune donnée n'arrive, l'alarme reste en OK
- `breaching` (status check, health check) → si aucune donnée n'arrive, l'alarme passe en ALARM

### 2.3 Rétention des logs (30 jours)

Les 7 groupes de logs sont créés s'ils n'existent pas, puis configurés avec une rétention de **30 jours**.  
Sans cette configuration, CloudWatch conserve les logs indéfiniment, ce qui augmente les coûts.

---

## Phase 3 — CloudTrail

**But :** Enregistrer tous les appels API AWS effectués dans le compte (création/suppression de ressources, tentatives d'accès, modifications de configuration…).

### Ressources créées

| Ressource | Nom | Description |
|-----------|-----|-------------|
| Bucket S3 | `medical-cloudtrail-{account_id}` | Stockage des fichiers de log CloudTrail |
| Trail | `medical-app-trail` | Capture des événements API AWS |

### Configuration du bucket S3

- **Accès public bloqué** : `BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets` → tous activés
- **Politique IAM** : autorise uniquement CloudTrail à écrire dans `AWSLogs/{account_id}/`

### Configuration du trail

| Option | Valeur | Effet |
|--------|--------|-------|
| `include-global-service-events` | activé | Capture les événements IAM, STS, CloudFront |
| `enable-log-file-validation` | activé | Crée un hash SHA-256 pour détecter toute altération des logs |

### Ce que CloudTrail enregistre

- Appels API EC2 : démarrage/arrêt d'instances, modifications de security groups
- Appels Terraform : `describe-instances`, `create-trail`, `put-metric-alarm`…
- Tentatives d'accès non autorisées
- Modifications de configuration IAM

> **Limite Learner Lab :** la création du bucket S3 et du trail peut être restreinte selon les permissions du compte. En cas d'échec, le job affiche un avertissement mais ne bloque pas le reste du monitoring.

---

## Phase 4 — Dashboard CloudWatch

**But :** Créer un tableau de bord visuel dans la console CloudWatch avec toutes les métriques et les logs.

**Nom du dashboard :** `MedicalApp-Monitoring`

**Lien direct :**  
`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=MedicalApp-Monitoring`

### Widgets du dashboard

| Position | Type | Contenu |
|----------|------|---------|
| En-tête | Texte | Titre + Instance ID + Région |
| Ligne 1, col 1 | Graphe | CPU total (%) avec seuil à 80 % |
| Ligne 1, col 2 | Graphe | Mémoire utilisée (%) avec seuil à 85 % |
| Ligne 1, col 3 | Graphe | Disque / utilisé (%) avec seuil à 85 % |
| Ligne 2, col 1-2 | Graphe | Trafic réseau entrant/sortant (bytes/min) |
| Ligne 2, col 3-4 | Graphe | I/O disque lectures/écritures (ops/min) |
| Ligne 3, col 1 | Graphe | CPU détail : user / system / iowait |
| Ligne 3, col 2 | Graphe | Swap utilisé (%) |
| Ligne 3, col 3 | Graphe | Disponibilité : Frontend / API / MySQL (1=OK, 0=DOWN) |
| Ligne 4 | Alarmes | État en temps réel des 8 alarmes |
| Ligne 5, col 1-2 | Log Insights | Erreurs Django/Gunicorn (ERROR, Exception, Traceback) |
| Ligne 5, col 3-4 | Log Insights | Erreurs Nginx |
| Ligne 6, col 1-2 | Log Insights | Répartition des codes HTTP (200, 400, 401, 403, 500…) |
| Ligne 6, col 3-4 | Log Insights | Erreurs MySQL (ERROR, Warning) |

Le dashboard est généré en Python avec le module `json` pour éviter les problèmes d'échappement dans le JSON, puis envoyé via `aws cloudwatch put-dashboard`.

---

## Phase 5 — Rapport de synthèse

Le dernier job s'exécute **toujours** (`if: always()`), même si une phase précédente a échoué.  
Il affiche dans les logs GitHub Actions :

- Le résultat de chaque phase (success / failure / skipped)
- La liste complète des métriques collectées
- La liste des logs centralisés
- L'état en temps réel des 8 alarmes (tableau)
- Les liens directs vers le dashboard, les alarmes et les groupes de logs

---

## Secret GitHub requis

| Secret | Valeur | Rôle |
|--------|--------|------|
| `SNS_ALERT_EMAIL` | ex: `najjarsafa57@gmail.com` | Adresse de réception des notifications d'alarme |

**Comment l'ajouter :**  
`GitHub → Settings → Secrets and variables → Actions → New repository secret`

---

## Résumé des namespaces CloudWatch

| Namespace | Source | Métriques |
|-----------|--------|-----------|
| `AWS/EC2` | Natif EC2 (pas d'agent) | CPUUtilization, NetworkIn/Out, StatusCheckFailed |
| `MedicalApp/System` | CloudWatch Agent | CPU détail, Mémoire, Disque, I/O, Réseau, Swap, Processus |
| `MedicalApp/Application` | Cron health check | FrontendHealthy, ApiHealthy, MysqlHealthy, AppHealthy |

---

## Schéma complet du flux de données

```
Instance EC2
├── CloudWatch Agent (daemon)
│   ├── collecte toutes les 60s  →  MedicalApp/System (CloudWatch Metrics)
│   └── collecte logs en continu →  CloudWatch Logs (/medical-app/*)
│
└── Cron /5 min (healthcheck.sh)
    └── curl localhost:80 + :8000 + systemctl mysql
        └── aws cloudwatch put-metric-data  →  MedicalApp/Application

CloudWatch Metrics + Logs
├── Alarmes (8)  →  SNS  →  Email najjarsafa57@gmail.com
└── Dashboard "MedicalApp-Monitoring"

AWS CloudTrail
└── Logs de tous les appels API  →  S3 (medical-cloudtrail-{account_id})
```
