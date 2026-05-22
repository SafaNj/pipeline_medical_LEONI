-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: medical_db
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_hsee`
--

DROP TABLE IF EXISTS `account_hsee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_hsee` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `zone` varchar(100) NOT NULL,
  `certification` varchar(100) NOT NULL,
  `profile_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`),
  KEY `account_hsee_site_id_e532a33a_fk_account_site_id` (`site_id`),
  CONSTRAINT `account_hsee_profile_id_0c480e7e_fk_account_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `account_hsee_site_id_e532a33a_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_hsee`
--

LOCK TABLES `account_hsee` WRITE;
/*!40000 ALTER TABLE `account_hsee` DISABLE KEYS */;
INSERT INTO `account_hsee` VALUES (1,'monastir','test',13,1),(2,'LTN3','test',12,3),(3,'LTN3','test',11,2);
/*!40000 ALTER TABLE `account_hsee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_infirmier`
--

DROP TABLE IF EXISTS `account_infirmier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_infirmier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `service` varchar(100) NOT NULL,
  `shift` varchar(50) NOT NULL,
  `profile_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`),
  KEY `account_infirmier_site_id_38023731_fk_account_site_id` (`site_id`),
  CONSTRAINT `account_infirmier_profile_id_e830691e_fk_account_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `account_infirmier_site_id_38023731_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_infirmier`
--

LOCK TABLES `account_infirmier` WRITE;
/*!40000 ALTER TABLE `account_infirmier` DISABLE KEYS */;
INSERT INTO `account_infirmier` VALUES (1,'medicale','Midi',2,1),(2,'medicale','Matin',7,2),(3,'medicale','Matin',8,3);
/*!40000 ALTER TABLE `account_infirmier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_medecin`
--

DROP TABLE IF EXISTS `account_medecin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_medecin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `specialite` varchar(100) NOT NULL,
  `numero_ordre` varchar(100) NOT NULL,
  `grade` varchar(100) DEFAULT NULL,
  `med_type_id` bigint DEFAULT NULL,
  `profile_id` bigint NOT NULL,
  `heures_par_defaut` int unsigned NOT NULL,
  `lieu_exercice_medecin` varchar(200) NOT NULL,
  `adresse_numero_rue` varchar(255) NOT NULL,
  `gouvernorat_cabinet` varchar(150) NOT NULL,
  `ville_cabinet` varchar(150) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  `nom_ar` varchar(200) NOT NULL,
  `prenom_ar` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`),
  KEY `account_medecin_med_type_id_2986f7f4_fk_account_medtype_id` (`med_type_id`),
  KEY `account_medecin_site_id_0271c402_fk_account_site_id` (`site_id`),
  CONSTRAINT `account_medecin_med_type_id_2986f7f4_fk_account_medtype_id` FOREIGN KEY (`med_type_id`) REFERENCES `account_medtype` (`id`),
  CONSTRAINT `account_medecin_profile_id_e59943e4_fk_account_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `account_medecin_site_id_0271c402_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `account_medecin_chk_1` CHECK ((`heures_par_defaut` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_medecin`
--

LOCK TABLES `account_medecin` WRITE;
/*!40000 ALTER TABLE `account_medecin` DISABLE KEYS */;
INSERT INTO `account_medecin` VALUES (1,'Généraliste','1',NULL,2,6,2,'','','','',1,'',''),(2,'Généraliste','12',NULL,2,5,2,'','','','',3,'',''),(3,'Généraliste','12',NULL,2,4,2,'','','','',2,'',''),(4,'Généraliste','12',NULL,1,14,2,'','','','',1,'',''),(5,'Généraliste','12',NULL,3,15,2,'','','','',1,'','');
/*!40000 ALTER TABLE `account_medecin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_medtype`
--

DROP TABLE IF EXISTS `account_medtype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_medtype` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_medtype`
--

LOCK TABLES `account_medtype` WRITE;
/*!40000 ALTER TABLE `account_medtype` DISABLE KEYS */;
INSERT INTO `account_medtype` VALUES (1,'traitant'),(2,'travail'),(3,'controleur');
/*!40000 ALTER TABLE `account_medtype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_profile`
--

DROP TABLE IF EXISTS `account_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_profile` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `user_id` int NOT NULL,
  `must_change_password` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `account_profile_user_id_bdd52018_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_profile`
--

LOCK TABLES `account_profile` WRITE;
/*!40000 ALTER TABLE `account_profile` DISABLE KEYS */;
INSERT INTO `account_profile` VALUES (1,'',NULL,1,1),(2,'infirmier','56683140',2,0),(3,'rh','56683140',3,0),(4,'medecin','56683140',4,0),(5,'medecin','56683140',5,0),(6,'medecin','56683140',6,0),(7,'infirmier','56683140',7,0),(8,'infirmier','56683140',8,0),(9,'rh','56683140',9,0),(10,'rh','56683140',10,0),(11,'hsse','56683140',11,1),(12,'hsse','56683140',12,1),(13,'hsse','56683140',13,1),(14,'medecin','56683140',14,0),(15,'medecin','56683140',15,0);
/*!40000 ALTER TABLE `account_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_rh`
--

DROP TABLE IF EXISTS `account_rh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_rh` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `departement` varchar(100) NOT NULL,
  `profile_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_id` (`profile_id`),
  KEY `account_rh_site_id_e8c51c46_fk_account_site_id` (`site_id`),
  CONSTRAINT `account_rh_profile_id_f09a661d_fk_account_profile_id` FOREIGN KEY (`profile_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `account_rh_site_id_e8c51c46_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_rh`
--

LOCK TABLES `account_rh` WRITE;
/*!40000 ALTER TABLE `account_rh` DISABLE KEYS */;
INSERT INTO `account_rh` VALUES (1,'Mrcedes',3,1),(2,'BM',9,2),(3,'BM',10,3);
/*!40000 ALTER TABLE `account_rh` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_site`
--

DROP TABLE IF EXISTS `account_site`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_site` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) NOT NULL,
  `nom_ar` varchar(150) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `telephone` varchar(30) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `logo` varchar(100) DEFAULT NULL,
  `template_key` varchar(20) NOT NULL,
  `nature_activite` varchar(255) NOT NULL,
  `numero_cnss` varchar(50) NOT NULL,
  `raison_sociale` varchar(255) NOT NULL,
  `adresse_entreprise` longtext NOT NULL,
  `numero_cnss_entreprise` varchar(50) NOT NULL,
  `qualifications` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_site`
--

LOCK TABLES `account_site` WRITE;
/*!40000 ALTER TABLE `account_site` DISABLE KEYS */;
INSERT INTO `account_site` VALUES (1,'Leoni Menzel Hayet','ليوني منزل حياة','Zone Industrielle, Menzel Hayet','+216 73 123 456','MENZEL_HAYET','','MENZEL_HAYET','Industrie automobile (câblage automobile)','6780','LEONI WIRING SYSTEMS TUNISIA','manzel hayet , Monastir','123456','qualifier'),(2,'Leoni Massadine','ليوني مساكن','Zone Industrielle, Massadine','+216 73 234 567','MASSADINE','','SOUSSE','Industrie automobile (câblage automobile)','678','LEONI Wiring Systems Tunisia SARL','Zone Industrielle - Messadine - 4013 Sousse, Tunisie','123456','qualifeir'),(3,'Leoni Mateur','ليوني ماطر','Zone Industrielle, Mateur','+216 72 345 678','MATEUR','','MATEUR','Industrie automobile (câblage automobile)','23455','LEONI WIRING SYSTEMS TUNISIA','Mateur ,Bizerte','1232343','Qualifier');
/*!40000 ALTER TABLE `account_site` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_absencemedecin`
--

DROP TABLE IF EXISTS `act_infirmier_absencemedecin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_absencemedecin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `motif` longtext NOT NULL,
  `mois` int unsigned NOT NULL,
  `annee` int unsigned NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `infirmiere_id` int NOT NULL,
  `medecin_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `act_infirmier_absencemedecin_medecin_id_date_1c877a3c_uniq` (`medecin_id`,`date`),
  KEY `act_infirmier_absenc_infirmiere_id_2395ef43_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_absencemedecin_site_id_b0254b50_fk_account_site_id` (`site_id`),
  CONSTRAINT `act_infirmier_absenc_infirmiere_id_2395ef43_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_absenc_medecin_id_230d8720_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `act_infirmier_absencemedecin_site_id_b0254b50_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `act_infirmier_absencemedecin_chk_1` CHECK ((`mois` >= 0)),
  CONSTRAINT `act_infirmier_absencemedecin_chk_2` CHECK ((`annee` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_absencemedecin`
--

LOCK TABLES `act_infirmier_absencemedecin` WRITE;
/*!40000 ALTER TABLE `act_infirmier_absencemedecin` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_absencemedecin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_accidenttravail`
--

DROP TABLE IF EXISTS `act_infirmier_accidenttravail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_accidenttravail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `date_accident` date NOT NULL,
  `heure_accident` time(6) DEFAULT NULL,
  `type_accident` longtext NOT NULL,
  `lieu_accident` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `siege_lesion` varchar(255) NOT NULL,
  `nature_lesion` varchar(255) NOT NULL,
  `cause_accident` varchar(255) NOT NULL,
  `agent_materiel` varchar(255) NOT NULL,
  `temoins` longtext NOT NULL,
  `repos_initial` int unsigned NOT NULL,
  `prolongation` int unsigned NOT NULL,
  `criticite` varchar(20) NOT NULL,
  `reprise_medecin_travail` date DEFAULT NULL,
  `date_declaration_service_medical` date NOT NULL,
  `date_sortie_declaration` date DEFAULT NULL,
  `chauffeur_sortie` varchar(255) NOT NULL,
  `reporting_interne` tinyint(1) NOT NULL,
  `reporting_wsd` tinyint(1) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `num_cnam` varchar(50) NOT NULL,
  `plant_section` varchar(150) NOT NULL,
  `total_jour_perdu` int unsigned NOT NULL,
  `categorie_accident` varchar(20) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_accide_collaborateur_id_8703621b_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_accide_infirmiere_id_4d289098_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_accide_site_id_07b1cf7c_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_accide_collaborateur_id_8703621b_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_accide_infirmiere_id_4d289098_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_accide_site_id_07b1cf7c_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `act_infirmier_accidenttravail_chk_1` CHECK ((`repos_initial` >= 0)),
  CONSTRAINT `act_infirmier_accidenttravail_chk_2` CHECK ((`prolongation` >= 0)),
  CONSTRAINT `act_infirmier_accidenttravail_chk_3` CHECK ((`total_jour_perdu` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_accidenttravail`
--

LOCK TABLES `act_infirmier_accidenttravail` WRITE;
/*!40000 ALTER TABLE `act_infirmier_accidenttravail` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_accidenttravail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_declarationcnam`
--

DROP TABLE IF EXISTS `act_infirmier_declarationcnam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_declarationcnam` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `matricule_cnss` varchar(50) NOT NULL,
  `type_accident` varchar(255) NOT NULL,
  `date_accident` date NOT NULL,
  `chauffeur` varchar(255) NOT NULL,
  `date_collecte_chauffeur` date DEFAULT NULL,
  `date_cachet_cnam` date DEFAULT NULL,
  `date_limite_declaration` date DEFAULT NULL,
  `nb_jours_retard` int NOT NULL,
  `cause_retard` longtext NOT NULL,
  `commentaire` longtext NOT NULL,
  `actions` longtext NOT NULL,
  `correction` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_declar_collaborateur_id_50e4edd9_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_declar_infirmiere_id_1a7741e1_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_declar_site_id_e8d88cbc_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_declar_collaborateur_id_50e4edd9_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_declar_infirmiere_id_1a7741e1_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_declar_site_id_e8d88cbc_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_declarationcnam`
--

LOCK TABLES `act_infirmier_declarationcnam` WRITE;
/*!40000 ALTER TABLE `act_infirmier_declarationcnam` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_declarationcnam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_documentmedicalscanne`
--

DROP TABLE IF EXISTS `act_infirmier_documentmedicalscanne`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_documentmedicalscanne` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `collaborateur_id` bigint DEFAULT NULL,
  `matricule_ref` varchar(50) NOT NULL,
  `type_document` varchar(32) NOT NULL,
  `fichier` varchar(100) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `commentaire` longtext NOT NULL,
  `date_document` date DEFAULT NULL,
  `date_depot` datetime(6) NOT NULL,
  `depose_par_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_docume_collaborateur_id_28f90ad3_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_docume_depose_par_id_b188f740_fk_auth_user` (`depose_par_id`),
  CONSTRAINT `act_infirmier_docume_collaborateur_id_28f90ad3_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_docume_depose_par_id_b188f740_fk_auth_user` FOREIGN KEY (`depose_par_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_documentmedicalscanne`
--

LOCK TABLES `act_infirmier_documentmedicalscanne` WRITE;
/*!40000 ALTER TABLE `act_infirmier_documentmedicalscanne` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_documentmedicalscanne` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_incidentavecbon`
--

DROP TABLE IF EXISTS `act_infirmier_incidentavecbon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_incidentavecbon` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_bon` date NOT NULL,
  `date_incident` date NOT NULL,
  `destination` varchar(255) NOT NULL,
  `cause` varchar(255) NOT NULL,
  `lesion` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `incident_origine_id` bigint DEFAULT NULL,
  `num_assurance` varchar(100) NOT NULL,
  `plant_section` varchar(150) NOT NULL,
  `segment` varchar(150) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_incide_collaborateur_id_0a2f2a5c_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_incide_infirmiere_id_34323fb9_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_incide_incident_origine_id_bc5f405b_fk_act_infir` (`incident_origine_id`),
  KEY `act_infirmier_incide_site_id_e5cee341_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_incide_collaborateur_id_0a2f2a5c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_incide_incident_origine_id_bc5f405b_fk_act_infir` FOREIGN KEY (`incident_origine_id`) REFERENCES `act_infirmier_incidentsansbon` (`id`),
  CONSTRAINT `act_infirmier_incide_infirmiere_id_34323fb9_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_incide_site_id_e5cee341_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_incidentavecbon`
--

LOCK TABLES `act_infirmier_incidentavecbon` WRITE;
/*!40000 ALTER TABLE `act_infirmier_incidentavecbon` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_incidentavecbon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_incidentsansbon`
--

DROP TABLE IF EXISTS `act_infirmier_incidentsansbon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_incidentsansbon` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `segment` varchar(150) NOT NULL,
  `plant_section` varchar(150) NOT NULL,
  `date_incident` date NOT NULL,
  `heure_incident` time(6) NOT NULL,
  `mode_lesion` longtext NOT NULL,
  `agent_causal` varchar(255) NOT NULL,
  `remarque` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_incide_collaborateur_id_e2ac324d_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_incide_infirmiere_id_81e66357_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_incide_site_id_883aa338_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_incide_collaborateur_id_e2ac324d_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_incide_infirmiere_id_81e66357_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_incide_site_id_883aa338_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_incidentsansbon`
--

LOCK TABLES `act_infirmier_incidentsansbon` WRITE;
/*!40000 ALTER TABLE `act_infirmier_incidentsansbon` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_incidentsansbon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_maladiechronique`
--

DROP TABLE IF EXISTS `act_infirmier_maladiechronique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_maladiechronique` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `segment` varchar(150) NOT NULL,
  `date_declaration` date NOT NULL,
  `type_maladie` varchar(50) NOT NULL,
  `type_maladie_autre` varchar(255) NOT NULL,
  `num_tel` varchar(20) NOT NULL,
  `commentaire` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_maladi_collaborateur_id_ece87d63_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_maladi_infirmiere_id_496bd856_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_maladi_site_id_c32c40b9_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_maladi_collaborateur_id_ece87d63_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_maladi_infirmiere_id_496bd856_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_maladi_site_id_c32c40b9_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_maladiechronique`
--

LOCK TABLES `act_infirmier_maladiechronique` WRITE;
/*!40000 ALTER TABLE `act_infirmier_maladiechronique` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_maladiechronique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_maladieprofessionnelle`
--

DROP TABLE IF EXISTS `act_infirmier_maladieprofessionnelle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_maladieprofessionnelle` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `plant_section` varchar(150) NOT NULL,
  `segment` varchar(150) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `mois` int unsigned NOT NULL,
  `date_debut_maladie` date NOT NULL,
  `maladie` varchar(255) NOT NULL,
  `code_tableau_cnam` varchar(50) NOT NULL,
  `cause` varchar(255) NOT NULL,
  `nature_travail` varchar(255) NOT NULL,
  `changement_poste` tinyint(1) NOT NULL,
  `ancien_poste` varchar(255) NOT NULL,
  `nouveau_poste` varchar(255) NOT NULL,
  `decision_medecin` varchar(255) NOT NULL,
  `repos_initial` int unsigned NOT NULL,
  `prolongation` int unsigned NOT NULL,
  `rechute` int unsigned NOT NULL,
  `reprise_medecin_traitant` tinyint(1) NOT NULL,
  `reprise_medecin_travail` date DEFAULT NULL,
  `date_declaration_service_medical` date NOT NULL,
  `date_sortie_declaration` varchar(255) NOT NULL,
  `chauffeur_sortie` varchar(255) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `anciennete` int unsigned NOT NULL,
  `repos_total` int unsigned NOT NULL,
  `site_id` bigint DEFAULT NULL,
  `is_tms` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_maladi_collaborateur_id_95d2f57c_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_maladi_infirmiere_id_934ddb05_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_maladi_site_id_0905bb82_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_maladi_collaborateur_id_95d2f57c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_maladi_infirmiere_id_934ddb05_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_maladi_site_id_0905bb82_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_1` CHECK ((`mois` >= 0)),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_2` CHECK ((`repos_initial` >= 0)),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_3` CHECK ((`prolongation` >= 0)),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_4` CHECK ((`rechute` >= 0)),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_5` CHECK ((`anciennete` >= 0)),
  CONSTRAINT `act_infirmier_maladieprofessionnelle_chk_6` CHECK ((`repos_total` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_maladieprofessionnelle`
--

LOCK TABLES `act_infirmier_maladieprofessionnelle` WRITE;
/*!40000 ALTER TABLE `act_infirmier_maladieprofessionnelle` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_maladieprofessionnelle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_ordretransport`
--

DROP TABLE IF EXISTS `act_infirmier_ordretransport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_ordretransport` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `motif` longtext NOT NULL,
  `accompagnant` varchar(200) NOT NULL,
  `moyen_transport` varchar(100) NOT NULL,
  `montant_prime` decimal(8,2) DEFAULT NULL,
  `date_creation` datetime(6) NOT NULL,
  `infirmier_id` int DEFAULT NULL,
  `medecin_id` bigint DEFAULT NULL,
  `transfert_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfert_id` (`transfert_id`),
  KEY `act_infirmier_ordret_infirmier_id_0264aba4_fk_auth_user` (`infirmier_id`),
  KEY `act_infirmier_ordret_medecin_id_37de8be2_fk_account_m` (`medecin_id`),
  KEY `act_infirmier_ordretransport_site_id_dd1ba05d_fk_account_site_id` (`site_id`),
  CONSTRAINT `act_infirmier_ordret_infirmier_id_0264aba4_fk_auth_user` FOREIGN KEY (`infirmier_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_ordret_medecin_id_37de8be2_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `act_infirmier_ordret_transfert_id_c8bcd632_fk_act_infir` FOREIGN KEY (`transfert_id`) REFERENCES `act_infirmier_transferturgence` (`id`),
  CONSTRAINT `act_infirmier_ordretransport_site_id_dd1ba05d_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_ordretransport`
--

LOCK TABLES `act_infirmier_ordretransport` WRITE;
/*!40000 ALTER TABLE `act_infirmier_ordretransport` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_ordretransport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_pointagemedecin`
--

DROP TABLE IF EXISTS `act_infirmier_pointagemedecin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_pointagemedecin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `heures_travaillees` int unsigned NOT NULL,
  `remarque` longtext NOT NULL,
  `mois` int unsigned NOT NULL,
  `annee` int unsigned NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `infirmiere_id` int NOT NULL,
  `medecin_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `act_infirmier_pointagemedecin_medecin_id_date_d41660f4_uniq` (`medecin_id`,`date`),
  KEY `act_infirmier_pointa_infirmiere_id_2b59a05e_fk_auth_user` (`infirmiere_id`),
  CONSTRAINT `act_infirmier_pointa_infirmiere_id_2b59a05e_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_pointa_medecin_id_94304b9a_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `act_infirmier_pointagemedecin_chk_1` CHECK ((`heures_travaillees` >= 0)),
  CONSTRAINT `act_infirmier_pointagemedecin_chk_2` CHECK ((`mois` >= 0)),
  CONSTRAINT `act_infirmier_pointagemedecin_chk_3` CHECK ((`annee` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_pointagemedecin`
--

LOCK TABLES `act_infirmier_pointagemedecin` WRITE;
/*!40000 ALTER TABLE `act_infirmier_pointagemedecin` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_pointagemedecin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_rendezvouspsychologue`
--

DROP TABLE IF EXISTS `act_infirmier_rendezvouspsychologue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_rendezvouspsychologue` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `segment` varchar(150) NOT NULL,
  `service` varchar(150) NOT NULL,
  `position` varchar(150) NOT NULL,
  `secteur_collaborateur` varchar(150) NOT NULL,
  `superieur_hierarchique` varchar(200) NOT NULL,
  `num_tel` varchar(20) NOT NULL,
  `date_rdv` date NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_rendez_collaborateur_id_ca8d5719_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_rendez_infirmiere_id_424b34b4_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_rendez_site_id_126500ad_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_rendez_collaborateur_id_ca8d5719_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_rendez_infirmiere_id_424b34b4_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_rendez_site_id_126500ad_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_rendezvouspsychologue`
--

LOCK TABLES `act_infirmier_rendezvouspsychologue` WRITE;
/*!40000 ALTER TABLE `act_infirmier_rendezvouspsychologue` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_rendezvouspsychologue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_rendezvoussagefemme`
--

DROP TABLE IF EXISTS `act_infirmier_rendezvoussagefemme`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_rendezvoussagefemme` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `segment` varchar(150) NOT NULL,
  `secteur_collaborateur` varchar(150) NOT NULL,
  `num_tel` varchar(20) NOT NULL,
  `date_rdv` date NOT NULL,
  `commentaire` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `motif_rdv` varchar(255) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_rendez_collaborateur_id_5c32ec8e_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_rendez_infirmiere_id_14eb7059_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_rendez_site_id_36dfa1fb_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_rendez_collaborateur_id_5c32ec8e_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_rendez_infirmiere_id_14eb7059_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_rendez_site_id_36dfa1fb_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_rendezvoussagefemme`
--

LOCK TABLES `act_infirmier_rendezvoussagefemme` WRITE;
/*!40000 ALTER TABLE `act_infirmier_rendezvoussagefemme` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_rendezvoussagefemme` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `act_infirmier_transferturgence`
--

DROP TABLE IF EXISTS `act_infirmier_transferturgence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `act_infirmier_transferturgence` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `heure` varchar(20) NOT NULL,
  `chauffeur` varchar(255) NOT NULL,
  `depart` varchar(255) NOT NULL,
  `destination` varchar(255) NOT NULL,
  `num_ordre` int unsigned NOT NULL,
  `plant` varchar(150) NOT NULL,
  `frais_deplacement` decimal(10,2) NOT NULL,
  `cost_center` varchar(150) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `infirmiere_id` int NOT NULL,
  `site_id` bigint DEFAULT NULL,
  `telephone_chauffeur` varchar(30) NOT NULL,
  `sms_chauffeur_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `act_infirmier_transf_collaborateur_id_c823a0db_fk_employees` (`collaborateur_id`),
  KEY `act_infirmier_transf_infirmiere_id_2ca1c625_fk_auth_user` (`infirmiere_id`),
  KEY `act_infirmier_transf_site_id_70846e36_fk_account_s` (`site_id`),
  CONSTRAINT `act_infirmier_transf_collaborateur_id_c823a0db_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `act_infirmier_transf_infirmiere_id_2ca1c625_fk_auth_user` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `act_infirmier_transf_site_id_70846e36_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `act_infirmier_transferturgence_chk_1` CHECK ((`num_ordre` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `act_infirmier_transferturgence`
--

LOCK TABLES `act_infirmier_transferturgence` WRITE;
/*!40000 ALTER TABLE `act_infirmier_transferturgence` DISABLE KEYS */;
/*!40000 ALTER TABLE `act_infirmier_transferturgence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
INSERT INTO `auth_group` VALUES (6,'HSSE'),(4,'Infirmier'),(3,'Medecin_Controleur'),(1,'Medecin_Traitant'),(2,'Medecin_Travail'),(5,'RH');
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add Token',7,'add_token'),(26,'Can change Token',7,'change_token'),(27,'Can delete Token',7,'delete_token'),(28,'Can view Token',7,'view_token'),(29,'Can add Token',8,'add_tokenproxy'),(30,'Can change Token',8,'change_tokenproxy'),(31,'Can delete Token',8,'delete_tokenproxy'),(32,'Can view Token',8,'view_tokenproxy'),(33,'Can add Blacklisted Token',9,'add_blacklistedtoken'),(34,'Can change Blacklisted Token',9,'change_blacklistedtoken'),(35,'Can delete Blacklisted Token',9,'delete_blacklistedtoken'),(36,'Can view Blacklisted Token',9,'view_blacklistedtoken'),(37,'Can add Outstanding Token',10,'add_outstandingtoken'),(38,'Can change Outstanding Token',10,'change_outstandingtoken'),(39,'Can delete Outstanding Token',10,'delete_outstandingtoken'),(40,'Can view Outstanding Token',10,'view_outstandingtoken'),(41,'Can add med type',11,'add_medtype'),(42,'Can change med type',11,'change_medtype'),(43,'Can delete med type',11,'delete_medtype'),(44,'Can view med type',11,'view_medtype'),(45,'Can add profile',12,'add_profile'),(46,'Can change profile',12,'change_profile'),(47,'Can delete profile',12,'delete_profile'),(48,'Can view profile',12,'view_profile'),(49,'Can add medecin',13,'add_medecin'),(50,'Can change medecin',13,'change_medecin'),(51,'Can delete medecin',13,'delete_medecin'),(52,'Can view medecin',13,'view_medecin'),(53,'Can add infirmier',14,'add_infirmier'),(54,'Can change infirmier',14,'change_infirmier'),(55,'Can delete infirmier',14,'delete_infirmier'),(56,'Can view infirmier',14,'view_infirmier'),(57,'Can add hsee',15,'add_hsee'),(58,'Can change hsee',15,'change_hsee'),(59,'Can delete hsee',15,'delete_hsee'),(60,'Can view hsee',15,'view_hsee'),(61,'Can add rh',16,'add_rh'),(62,'Can change rh',16,'change_rh'),(63,'Can delete rh',16,'delete_rh'),(64,'Can view rh',16,'view_rh'),(65,'Can add site',17,'add_site'),(66,'Can change site',17,'change_site'),(67,'Can delete site',17,'delete_site'),(68,'Can view site',17,'view_site'),(69,'Can add collaborateur',18,'add_collaborateur'),(70,'Can change collaborateur',18,'change_collaborateur'),(71,'Can delete collaborateur',18,'delete_collaborateur'),(72,'Can view collaborateur',18,'view_collaborateur'),(73,'Can add resource im',19,'add_resourceim'),(74,'Can change resource im',19,'change_resourceim'),(75,'Can delete resource im',19,'delete_resourceim'),(76,'Can view resource im',19,'view_resourceim'),(77,'Can add dossier medical',20,'add_dossiermedical'),(78,'Can change dossier medical',20,'change_dossiermedical'),(79,'Can delete dossier medical',20,'delete_dossiermedical'),(80,'Can view dossier medical',20,'view_dossiermedical'),(81,'Can add consultation',21,'add_consultation'),(82,'Can change consultation',21,'change_consultation'),(83,'Can delete consultation',21,'delete_consultation'),(84,'Can view consultation',21,'view_consultation'),(85,'Can add certificat medical',22,'add_certificatmedical'),(86,'Can change certificat medical',22,'change_certificatmedical'),(87,'Can delete certificat medical',22,'delete_certificatmedical'),(88,'Can view certificat medical',22,'view_certificatmedical'),(89,'Can add ordonnance',23,'add_ordonnance'),(90,'Can change ordonnance',23,'change_ordonnance'),(91,'Can delete ordonnance',23,'delete_ordonnance'),(92,'Can view ordonnance',23,'view_ordonnance'),(93,'Can add ligne ordonnance',24,'add_ligneordonnance'),(94,'Can change ligne ordonnance',24,'change_ligneordonnance'),(95,'Can delete ligne ordonnance',24,'delete_ligneordonnance'),(96,'Can view ligne ordonnance',24,'view_ligneordonnance'),(97,'Can add Posologie standard',25,'add_posologiestandard'),(98,'Can change Posologie standard',25,'change_posologiestandard'),(99,'Can delete Posologie standard',25,'delete_posologiestandard'),(100,'Can view Posologie standard',25,'view_posologiestandard'),(101,'Can add certificat aptitude generale',26,'add_certificataptitudegenerale'),(102,'Can change certificat aptitude generale',26,'change_certificataptitudegenerale'),(103,'Can delete certificat aptitude generale',26,'delete_certificataptitudegenerale'),(104,'Can view certificat aptitude generale',26,'view_certificataptitudegenerale'),(105,'Can add certificat bonne sante',27,'add_certificatbonnesante'),(106,'Can change certificat bonne sante',27,'change_certificatbonnesante'),(107,'Can delete certificat bonne sante',27,'delete_certificatbonnesante'),(108,'Can view certificat bonne sante',27,'view_certificatbonnesante'),(109,'Can add certificat exemption',28,'add_certificatexemption'),(110,'Can change certificat exemption',28,'change_certificatexemption'),(111,'Can delete certificat exemption',28,'delete_certificatexemption'),(112,'Can view certificat exemption',28,'view_certificatexemption'),(113,'Can add certificat permis conduire',29,'add_certificatpermisconduire'),(114,'Can change certificat permis conduire',29,'change_certificatpermisconduire'),(115,'Can delete certificat permis conduire',29,'delete_certificatpermisconduire'),(116,'Can view certificat permis conduire',29,'view_certificatpermisconduire'),(117,'Can add certificat prenuptial',30,'add_certificatprenuptial'),(118,'Can change certificat prenuptial',30,'change_certificatprenuptial'),(119,'Can delete certificat prenuptial',30,'delete_certificatprenuptial'),(120,'Can view certificat prenuptial',30,'view_certificatprenuptial'),(121,'Can add Fiche d\'Aptitude',31,'add_ficheaptitude'),(122,'Can change Fiche d\'Aptitude',31,'change_ficheaptitude'),(123,'Can delete Fiche d\'Aptitude',31,'delete_ficheaptitude'),(124,'Can view Fiche d\'Aptitude',31,'view_ficheaptitude'),(125,'Can add Demande d\'Examen',32,'add_demandeexamen'),(126,'Can change Demande d\'Examen',32,'change_demandeexamen'),(127,'Can delete Demande d\'Examen',32,'delete_demandeexamen'),(128,'Can view Demande d\'Examen',32,'view_demandeexamen'),(129,'Can add Demande de Bilan',33,'add_demandebilan'),(130,'Can change Demande de Bilan',33,'change_demandebilan'),(131,'Can delete Demande de Bilan',33,'delete_demandebilan'),(132,'Can view Demande de Bilan',33,'view_demandebilan'),(133,'Can add Certificat d\'Aptitude',34,'add_certificataptitude'),(134,'Can change Certificat d\'Aptitude',34,'change_certificataptitude'),(135,'Can delete Certificat d\'Aptitude',34,'delete_certificataptitude'),(136,'Can view Certificat d\'Aptitude',34,'view_certificataptitude'),(137,'Can add Remarque infirmier',35,'add_remarqueinfirmier'),(138,'Can change Remarque infirmier',35,'change_remarqueinfirmier'),(139,'Can delete Remarque infirmier',35,'delete_remarqueinfirmier'),(140,'Can view Remarque infirmier',35,'view_remarqueinfirmier'),(141,'Can add Ordonnance',36,'add_ordonnance'),(142,'Can change Ordonnance',36,'change_ordonnance'),(143,'Can delete Ordonnance',36,'delete_ordonnance'),(144,'Can view Ordonnance',36,'view_ordonnance'),(145,'Can add Fiche de Liaison',37,'add_ficheliaison'),(146,'Can change Fiche de Liaison',37,'change_ficheliaison'),(147,'Can delete Fiche de Liaison',37,'delete_ficheliaison'),(148,'Can view Fiche de Liaison',37,'view_ficheliaison'),(149,'Can add Certificat d\'Aptitude (Mateur)',38,'add_certificataptitudemateur'),(150,'Can change Certificat d\'Aptitude (Mateur)',38,'change_certificataptitudemateur'),(151,'Can delete Certificat d\'Aptitude (Mateur)',38,'delete_certificataptitudemateur'),(152,'Can view Certificat d\'Aptitude (Mateur)',38,'view_certificataptitudemateur'),(153,'Can add Fiche SMS (Mateur)',39,'add_fichesurveillancespecialemateur'),(154,'Can change Fiche SMS (Mateur)',39,'change_fichesurveillancespecialemateur'),(155,'Can delete Fiche SMS (Mateur)',39,'delete_fichesurveillancespecialemateur'),(156,'Can view Fiche SMS (Mateur)',39,'view_fichesurveillancespecialemateur'),(157,'Can add Contrôle Médical',40,'add_controlemedical'),(158,'Can change Contrôle Médical',40,'change_controlemedical'),(159,'Can delete Contrôle Médical',40,'delete_controlemedical'),(160,'Can view Contrôle Médical',40,'view_controlemedical'),(161,'Can add Contre-Visite',41,'add_contrevisite'),(162,'Can change Contre-Visite',41,'change_contrevisite'),(163,'Can delete Contre-Visite',41,'delete_contrevisite'),(164,'Can view Contre-Visite',41,'view_contrevisite'),(165,'Can add Demande d expertise',42,'add_demandeexpertise'),(166,'Can change Demande d expertise',42,'change_demandeexpertise'),(167,'Can delete Demande d expertise',42,'delete_demandeexpertise'),(168,'Can view Demande d expertise',42,'view_demandeexpertise'),(169,'Can add Liste contre-visite',43,'add_listecontrevisite'),(170,'Can change Liste contre-visite',43,'change_listecontrevisite'),(171,'Can delete Liste contre-visite',43,'delete_listecontrevisite'),(172,'Can view Liste contre-visite',43,'view_listecontrevisite'),(173,'Can add Ligne contre-visite',44,'add_lignecontrevisite'),(174,'Can change Ligne contre-visite',44,'change_lignecontrevisite'),(175,'Can delete Ligne contre-visite',44,'delete_lignecontrevisite'),(176,'Can view Ligne contre-visite',44,'view_lignecontrevisite'),(177,'Can add Liste de passage',45,'add_listepassage'),(178,'Can change Liste de passage',45,'change_listepassage'),(179,'Can delete Liste de passage',45,'delete_listepassage'),(180,'Can view Liste de passage',45,'view_listepassage'),(181,'Can add Item de passage',46,'add_itempassage'),(182,'Can change Item de passage',46,'change_itempassage'),(183,'Can delete Item de passage',46,'delete_itempassage'),(184,'Can view Item de passage',46,'view_itempassage'),(185,'Can add Accident de travail',47,'add_accidenttravail'),(186,'Can change Accident de travail',47,'change_accidenttravail'),(187,'Can delete Accident de travail',47,'delete_accidenttravail'),(188,'Can view Accident de travail',47,'view_accidenttravail'),(189,'Can add Maladie professionnelle',48,'add_maladieprofessionnelle'),(190,'Can change Maladie professionnelle',48,'change_maladieprofessionnelle'),(191,'Can delete Maladie professionnelle',48,'delete_maladieprofessionnelle'),(192,'Can view Maladie professionnelle',48,'view_maladieprofessionnelle'),(193,'Can add Incident avec bon de sortie',49,'add_incidentavecbon'),(194,'Can change Incident avec bon de sortie',49,'change_incidentavecbon'),(195,'Can delete Incident avec bon de sortie',49,'delete_incidentavecbon'),(196,'Can view Incident avec bon de sortie',49,'view_incidentavecbon'),(197,'Can add Incident sans bon de sortie',50,'add_incidentsansbon'),(198,'Can change Incident sans bon de sortie',50,'change_incidentsansbon'),(199,'Can delete Incident sans bon de sortie',50,'delete_incidentsansbon'),(200,'Can view Incident sans bon de sortie',50,'view_incidentsansbon'),(201,'Can add Declaration CNAM',51,'add_declarationcnam'),(202,'Can change Declaration CNAM',51,'change_declarationcnam'),(203,'Can delete Declaration CNAM',51,'delete_declarationcnam'),(204,'Can view Declaration CNAM',51,'view_declarationcnam'),(205,'Can add Transfert urgence',52,'add_transferturgence'),(206,'Can change Transfert urgence',52,'change_transferturgence'),(207,'Can delete Transfert urgence',52,'delete_transferturgence'),(208,'Can view Transfert urgence',52,'view_transferturgence'),(209,'Can add Absence médecin',53,'add_absencemedecin'),(210,'Can change Absence médecin',53,'change_absencemedecin'),(211,'Can delete Absence médecin',53,'delete_absencemedecin'),(212,'Can view Absence médecin',53,'view_absencemedecin'),(213,'Can add Pointage médecin',54,'add_pointagemedecin'),(214,'Can change Pointage médecin',54,'change_pointagemedecin'),(215,'Can delete Pointage médecin',54,'delete_pointagemedecin'),(216,'Can view Pointage médecin',54,'view_pointagemedecin'),(217,'Can add Ordre de transport',55,'add_ordretransport'),(218,'Can change Ordre de transport',55,'change_ordretransport'),(219,'Can delete Ordre de transport',55,'delete_ordretransport'),(220,'Can view Ordre de transport',55,'view_ordretransport'),(221,'Can add Enquête accident du travail',56,'add_enqueteaccident'),(222,'Can change Enquête accident du travail',56,'change_enqueteaccident'),(223,'Can delete Enquête accident du travail',56,'delete_enqueteaccident'),(224,'Can view Enquête accident du travail',56,'view_enqueteaccident'),(225,'Can add Document médical scanné',57,'add_documentmedicalscanne'),(226,'Can change Document médical scanné',57,'change_documentmedicalscanne'),(227,'Can delete Document médical scanné',57,'delete_documentmedicalscanne'),(228,'Can view Document médical scanné',57,'view_documentmedicalscanne'),(229,'Can add Maladie chronique',58,'add_maladiechronique'),(230,'Can change Maladie chronique',58,'change_maladiechronique'),(231,'Can delete Maladie chronique',58,'delete_maladiechronique'),(232,'Can view Maladie chronique',58,'view_maladiechronique'),(233,'Can add RDV Psychologue du travail',59,'add_rendezvouspsychologue'),(234,'Can change RDV Psychologue du travail',59,'change_rendezvouspsychologue'),(235,'Can delete RDV Psychologue du travail',59,'delete_rendezvouspsychologue'),(236,'Can view RDV Psychologue du travail',59,'view_rendezvouspsychologue'),(237,'Can add RDV Sage-femme',60,'add_rendezvoussagefemme'),(238,'Can change RDV Sage-femme',60,'change_rendezvoussagefemme'),(239,'Can delete RDV Sage-femme',60,'delete_rendezvoussagefemme'),(240,'Can view RDV Sage-femme',60,'view_rendezvoussagefemme'),(241,'Can add medicament',61,'add_medicament'),(242,'Can change medicament',61,'change_medicament'),(243,'Can delete medicament',61,'delete_medicament'),(244,'Can view medicament',61,'view_medicament'),(245,'Can add stock medicament',62,'add_stockmedicament'),(246,'Can change stock medicament',62,'change_stockmedicament'),(247,'Can delete stock medicament',62,'delete_stockmedicament'),(248,'Can view stock medicament',62,'view_stockmedicament'),(249,'Can add acte infirmier',63,'add_acteinfirmier'),(250,'Can change acte infirmier',63,'change_acteinfirmier'),(251,'Can delete acte infirmier',63,'delete_acteinfirmier'),(252,'Can view acte infirmier',63,'view_acteinfirmier'),(253,'Can add mouvement stock',64,'add_mouvementstock'),(254,'Can change mouvement stock',64,'change_mouvementstock'),(255,'Can delete mouvement stock',64,'delete_mouvementstock'),(256,'Can view mouvement stock',64,'view_mouvementstock'),(257,'Can add Liste embauche',65,'add_listeembauche'),(258,'Can change Liste embauche',65,'change_listeembauche'),(259,'Can delete Liste embauche',65,'delete_listeembauche'),(260,'Can view Liste embauche',65,'view_listeembauche'),(261,'Can add Candidat embauche',66,'add_candidatembauche'),(262,'Can change Candidat embauche',66,'change_candidatembauche'),(263,'Can delete Candidat embauche',66,'delete_candidatembauche'),(264,'Can view Candidat embauche',66,'view_candidatembauche'),(265,'Can add Liste visite périodique',67,'add_listevisiteperiodique'),(266,'Can change Liste visite périodique',67,'change_listevisiteperiodique'),(267,'Can delete Liste visite périodique',67,'delete_listevisiteperiodique'),(268,'Can view Liste visite périodique',67,'view_listevisiteperiodique'),(269,'Can add Ligne visite périodique',68,'add_lignevisiteperiodique'),(270,'Can change Ligne visite périodique',68,'change_lignevisiteperiodique'),(271,'Can delete Ligne visite périodique',68,'delete_lignevisiteperiodique'),(272,'Can view Ligne visite périodique',68,'view_lignevisiteperiodique'),(273,'Can add Liste surveillance médicale spéciale',69,'add_listesurveillancespeciale'),(274,'Can change Liste surveillance médicale spéciale',69,'change_listesurveillancespeciale'),(275,'Can delete Liste surveillance médicale spéciale',69,'delete_listesurveillancespeciale'),(276,'Can view Liste surveillance médicale spéciale',69,'view_listesurveillancespeciale'),(277,'Can add Ligne surveillance médicale spéciale',70,'add_lignesurveillancespeciale'),(278,'Can change Ligne surveillance médicale spéciale',70,'change_lignesurveillancespeciale'),(279,'Can delete Ligne surveillance médicale spéciale',70,'delete_lignesurveillancespeciale'),(280,'Can view Ligne surveillance médicale spéciale',70,'view_lignesurveillancespeciale'),(281,'Can add Paramètre HSEE mensuel',71,'add_parametrehseemensuel'),(282,'Can change Paramètre HSEE mensuel',71,'change_parametrehseemensuel'),(283,'Can delete Paramètre HSEE mensuel',71,'delete_parametrehseemensuel'),(284,'Can view Paramètre HSEE mensuel',71,'view_parametrehseemensuel'),(285,'Can add Équipement médical endommagé',72,'add_equipementmedicalendommage'),(286,'Can change Équipement médical endommagé',72,'change_equipementmedicalendommage'),(287,'Can delete Équipement médical endommagé',72,'delete_equipementmedicalendommage'),(288,'Can view Équipement médical endommagé',72,'view_equipementmedicalendommage'),(289,'Can add Notification HSSE',73,'add_notificationhsse'),(290,'Can change Notification HSSE',73,'change_notificationhsse'),(291,'Can delete Notification HSSE',73,'delete_notificationhsse'),(292,'Can view Notification HSSE',73,'view_notificationhsse');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$1000000$fzvpbUXqpjlYVmCMe78lTc$6B0Hbhq2vyRuCubNO+e4VsfNhtzkwHNlzsj8P8hJgOg=','2026-05-09 21:43:43.090154',1,'admin','','','najjarsafa57@gmail.com',1,1,'2026-05-09 21:43:29.077950'),(2,'pbkdf2_sha256$1000000$18wyiLYn2IzOXzMWraA94C$1yq0csI5q+pDq0rFYPHk/BdoK900dcbaQLOfOEGW5wU=',NULL,0,'safa','Safa','Najjar','',0,1,'2026-05-09 21:46:52.000000'),(3,'pbkdf2_sha256$1000000$HTRdPU9TepZDjOzlv9fdRj$z4vdSYM43Z7mKfB1fzZbxVjUXxd3pa5Vv9K3A4NxFgY=',NULL,0,'ali','Ali','Najjar','',0,1,'2026-05-09 21:47:12.000000'),(4,'pbkdf2_sha256$1000000$6xBvpylDTh2Db9KCVPhB1T$+mt+NEmsiHar/kWc2LpTYfhq01T2QI6o/EAngUpotLQ=',NULL,0,'nadia','Nadia','Najjar','',0,1,'2026-05-09 21:47:28.000000'),(5,'pbkdf2_sha256$1000000$huN0cEYw2ikYugC19W4xI3$jkl/asxd63sXY4BoO7s+yxhN4bWr983RpRChW1ZK2HE=',NULL,0,'fatiha','Fatiha','Kilani','',0,1,'2026-05-09 21:47:44.000000'),(6,'pbkdf2_sha256$1000000$iSJXr4uqayEzjFhv5g8PGz$N1M1ASiYd12fyAjQtjc6vSDIa4sP/Ng/ecAscXAeaLw=',NULL,0,'faten','Faten','Najjar','',0,1,'2026-05-09 21:47:58.000000'),(7,'pbkdf2_sha256$1000000$yu1ELKq8fFugefSwwaKXyJ$/BMvJ64XjKUJPFty4t9MgNlO/oCuu61Wc8/RYJH2jgQ=',NULL,0,'naira','Naira','Najjar','',0,1,'2026-05-09 21:50:08.000000'),(8,'pbkdf2_sha256$1000000$SmyuFmILFMClVNNuZD5bUi$O8fAS9SbgBk4JYbL27rSJf8fVJnknl547JBpa7JtMJw=',NULL,0,'mariem','Mariem','Ben jomaa','',0,1,'2026-05-09 21:52:06.000000'),(9,'pbkdf2_sha256$1000000$wMUYdyCZK0ejffatnYS4m4$D4C0GbAivztmLKCJtHvhpk8dDNBwrWyr3dLGv4vXeBY=',NULL,0,'Youssef','Youssef','Ben jomaa','',0,1,'2026-05-09 21:53:15.000000'),(10,'pbkdf2_sha256$1000000$vM5pSyrmMN6gdflhFhNID1$VZpjrnLfk/Zh2XphAm57PDxqkeyQcZRH/cbF4ssiwYc=',NULL,0,'yassine','Yassine','Ben jomaa','',0,1,'2026-05-09 21:54:09.000000'),(11,'pbkdf2_sha256$1000000$fUdVdGoQ4E6VNJEbRtQcK4$YTE0Tc+/yklPIeQOXmorTfPsllIojFRZrUWZKSKKC8I=',NULL,0,'idriss','Idriss','Bel haj sallah','',0,1,'2026-05-09 21:57:47.000000'),(12,'pbkdf2_sha256$1000000$tFLC9Wq3cQpsJ867VZ1zGf$eZJqurQn3Y6Q7B4EYGIXdGgqF8zLiGDsOfPb+x6N620=',NULL,0,'sedki','Sedki','Bel haj sallah','',0,1,'2026-05-09 21:58:13.000000'),(13,'pbkdf2_sha256$1000000$Edz5v2Qvuh0mrICEDc3JOc$EgC2VeKmHskUHQq6w+5ywqhm1qrhRt2X7mckqLxm8Ec=',NULL,0,'sofien','Sofien','Ben jomaa','',0,1,'2026-05-09 21:58:42.000000'),(14,'pbkdf2_sha256$1000000$cNf3Ob5ohaoo02RcjFX9WU$XbxsQtWgIUmhnrBzxbZB7iiZJQdKaO001BsUtNP8o8A=',NULL,0,'sallem','sallem','Najjar','',0,1,'2026-05-16 20:22:27.000000'),(15,'pbkdf2_sha256$1000000$BoKYibfdwz1KWXIErEFLUK$irXJeM5kk+rVwoIvDF2tOfliQ7OwKM5zLnGgp0ZKuTA=',NULL,0,'salah','salah','Najjar','',0,1,'2026-05-18 21:03:25.000000');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
INSERT INTO `auth_user_groups` VALUES (14,2,4),(13,3,5),(18,4,2),(21,5,2),(15,6,2),(17,7,4),(20,8,4),(16,9,5),(19,10,5),(12,11,6),(11,12,6),(10,13,6),(23,14,1),(25,15,3);
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authtoken_token`
--

DROP TABLE IF EXISTS `authtoken_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authtoken_token` (
  `key` varchar(40) NOT NULL,
  `created` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`key`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `authtoken_token_user_id_35299eff_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authtoken_token`
--

LOCK TABLES `authtoken_token` WRITE;
/*!40000 ALTER TABLE `authtoken_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `authtoken_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificats_aptitude`
--

DROP TABLE IF EXISTS `certificats_aptitude`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificats_aptitude` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_emission` date NOT NULL,
  `fiche_aptitude_id` bigint NOT NULL,
  `description` longtext NOT NULL DEFAULT (_utf8mb4'1'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiche_aptitude_id` (`fiche_aptitude_id`),
  CONSTRAINT `certificats_aptitude_fiche_aptitude_id_8489864b_fk_fiches_ap` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificats_aptitude`
--

LOCK TABLES `certificats_aptitude` WRITE;
/*!40000 ALTER TABLE `certificats_aptitude` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificats_aptitude` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificats_aptitude_mateur`
--

DROP TABLE IF EXISTS `certificats_aptitude_mateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificats_aptitude_mateur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `certificat_id` bigint NOT NULL,
  `apc_accident_travail_sequelles` longtext NOT NULL,
  `apc_maladie_professionnelle` longtext NOT NULL,
  `apc_maladies_chroniques` longtext NOT NULL,
  `aptitude` varchar(30) NOT NULL,
  `autres_remarques` longtext NOT NULL,
  `avis_assis_prolonge` longtext NOT NULL,
  `avis_charge_sup_4kg` longtext NOT NULL,
  `avis_cou` longtext NOT NULL,
  `avis_debout_prolonge` longtext NOT NULL,
  `avis_effort_precision_concentration` longtext NOT NULL,
  `avis_etat_general_efficience` longtext NOT NULL,
  `avis_poignet_bras_epaule` longtext NOT NULL,
  `avis_rotation_equipe_possible` longtext NOT NULL,
  `type_visite` varchar(30) NOT NULL,
  `zone_coupe_autres_remarques` longtext NOT NULL,
  `zone_coupe_coupe` longtext NOT NULL,
  `zone_coupe_sertissage_manuel` longtext NOT NULL,
  `zone_montage_autre_postes` longtext NOT NULL,
  `zone_montage_bol` longtext NOT NULL,
  `zone_montage_c_agrafs` longtext NOT NULL,
  `zone_montage_c_final` longtext NOT NULL,
  `zone_montage_goulotte` longtext NOT NULL,
  `zone_montage_lad` longtext NOT NULL,
  `zone_montage_pu` longtext NOT NULL,
  `zone_montage_sous_element` longtext NOT NULL,
  `zone_montage_vissage` longtext NOT NULL,
  `zone_prep_autres_remarques` longtext NOT NULL,
  `zone_prep_eiamage` longtext NOT NULL,
  `zone_prep_epissure` longtext NOT NULL,
  `zone_prep_kabatec` longtext NOT NULL,
  `zone_prep_lovage` longtext NOT NULL,
  `zone_prep_retreint` longtext NOT NULL,
  `zone_prep_torsadage` longtext NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `medecin_travail_id` bigint DEFAULT NULL,
  `entete_certificat_medical_aptitude` tinyint(1) NOT NULL,
  `entete_reprise_au_poste` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificat_id` (`certificat_id`),
  KEY `certificats_aptitude_collaborateur_id_adf7f0f1_fk_employees` (`collaborateur_id`),
  KEY `certificats_aptitude_medecin_travail_id_524bfc64_fk_account_m` (`medecin_travail_id`),
  CONSTRAINT `certificats_aptitude_certificat_id_e78e78f3_fk_certifica` FOREIGN KEY (`certificat_id`) REFERENCES `certificats_aptitude` (`id`),
  CONSTRAINT `certificats_aptitude_collaborateur_id_adf7f0f1_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `certificats_aptitude_medecin_travail_id_524bfc64_fk_account_m` FOREIGN KEY (`medecin_travail_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificats_aptitude_mateur`
--

LOCK TABLES `certificats_aptitude_mateur` WRITE;
/*!40000 ALTER TABLE `certificats_aptitude_mateur` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificats_aptitude_mateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificataptitudegenerale`
--

DROP TABLE IF EXISTS `consultations_certificataptitudegenerale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificataptitudegenerale` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom_patient` varchar(200) NOT NULL,
  `date_naissance` date NOT NULL,
  `est_bonne_sante` tinyint(1) NOT NULL,
  `indemne_pathologie_contagieuse` tinyint(1) NOT NULL,
  `apte_sport` tinyint(1) NOT NULL,
  `apte_collectivite` tinyint(1) NOT NULL,
  `date_emission` date NOT NULL,
  `consultation_id` bigint NOT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_64c85fdd_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_64c85fdd_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificataptitudegenerale`
--

LOCK TABLES `consultations_certificataptitudegenerale` WRITE;
/*!40000 ALTER TABLE `consultations_certificataptitudegenerale` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificataptitudegenerale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificatbonnesante`
--

DROP TABLE IF EXISTS `consultations_certificatbonnesante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificatbonnesante` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom_enfant` varchar(200) NOT NULL,
  `date_naissance` date NOT NULL,
  `date_emission` date NOT NULL,
  `consultation_id` bigint DEFAULT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_65d20c7c_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_65d20c7c_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificatbonnesante`
--

LOCK TABLES `consultations_certificatbonnesante` WRITE;
/*!40000 ALTER TABLE `consultations_certificatbonnesante` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificatbonnesante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificatexemption`
--

DROP TABLE IF EXISTS `consultations_certificatexemption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificatexemption` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_patient` varchar(200) NOT NULL,
  `duree_exemption` varchar(100) NOT NULL,
  `date_emission` date NOT NULL,
  `consultation_id` bigint NOT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_54d43371_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_54d43371_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificatexemption`
--

LOCK TABLES `consultations_certificatexemption` WRITE;
/*!40000 ALTER TABLE `consultations_certificatexemption` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificatexemption` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificatmedical`
--

DROP TABLE IF EXISTS `consultations_certificatmedical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificatmedical` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_emission` date NOT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  `nom_prenom_collab` varchar(200) NOT NULL,
  `jours_repos` int unsigned NOT NULL,
  `date_debut_repos` date NOT NULL,
  `consultation_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_32226b17_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_32226b17_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`),
  CONSTRAINT `consultations_certificatmedical_chk_1` CHECK ((`jours_repos` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificatmedical`
--

LOCK TABLES `consultations_certificatmedical` WRITE;
/*!40000 ALTER TABLE `consultations_certificatmedical` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificatmedical` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificatpermisconduire`
--

DROP TABLE IF EXISTS `consultations_certificatpermisconduire`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificatpermisconduire` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom` varchar(200) NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(200) NOT NULL,
  `cin` varchar(50) NOT NULL,
  `cin_delivree_a` varchar(200) NOT NULL,
  `cin_date` date DEFAULT NULL,
  `groupe_permis` varchar(20) NOT NULL,
  `date_emission` date NOT NULL,
  `consultation_id` bigint NOT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  `classe` varchar(100) NOT NULL,
  `paragraphe` varchar(100) NOT NULL,
  `sous_paragraphe` varchar(100) NOT NULL,
  `lieu_exercice_medecin` varchar(200) NOT NULL,
  `numero_ordre_medecin` varchar(100) NOT NULL,
  `adresse_residence` varchar(255) NOT NULL,
  `certificat_delivre_par_specialiste` tinyint(1) NOT NULL,
  `certificat_delivre_par_specialiste_type` varchar(200) NOT NULL,
  `examine_par_specialiste` tinyint(1) NOT NULL,
  `examine_par_specialiste_type` varchar(200) NOT NULL,
  `inapte_conduite` tinyint(1) NOT NULL,
  `inapte_conduite_raison` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_0a8673e4_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_0a8673e4_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificatpermisconduire`
--

LOCK TABLES `consultations_certificatpermisconduire` WRITE;
/*!40000 ALTER TABLE `consultations_certificatpermisconduire` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificatpermisconduire` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_certificatprenuptial`
--

DROP TABLE IF EXISTS `consultations_certificatprenuptial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_certificatprenuptial` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom_prenom` varchar(200) NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance` varchar(200) NOT NULL,
  `cin` varchar(50) NOT NULL,
  `groupe_sanguin_fait` tinyint(1) NOT NULL,
  `hepatite_b_fait` tinyint(1) NOT NULL,
  `hepatite_c_fait` tinyint(1) NOT NULL,
  `radio_thorax_fait` tinyint(1) NOT NULL,
  `autres_examens` longtext NOT NULL,
  `date_emission` date NOT NULL,
  `consultation_id` bigint NOT NULL,
  `nom_prenom_medecin` varchar(200) NOT NULL,
  `adresse_medecin` varchar(255) NOT NULL,
  `numero_ordre_medecin` varchar(100) NOT NULL,
  `specialite_medecin` varchar(150) NOT NULL,
  `adresse_patient` varchar(255) NOT NULL,
  `lieu_exercice_medecin` varchar(200) NOT NULL,
  `lieu_signature` varchar(200) NOT NULL,
  `gouvernorat_medecin` varchar(150) NOT NULL,
  `ville_medecin` varchar(150) NOT NULL,
  `cin_date` date DEFAULT NULL,
  `cin_delivree_a` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_certif_consultation_id_80219b97_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_certif_consultation_id_80219b97_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_certificatprenuptial`
--

LOCK TABLES `consultations_certificatprenuptial` WRITE;
/*!40000 ALTER TABLE `consultations_certificatprenuptial` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_certificatprenuptial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_consultation`
--

DROP TABLE IF EXISTS `consultations_consultation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_consultation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_consultation` datetime(6) NOT NULL,
  `diagnostic` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `item_passage_id` bigint NOT NULL,
  `medecin_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_passage_id` (`item_passage_id`),
  KEY `consultations_consul_medecin_id_28643c29_fk_account_m` (`medecin_id`),
  KEY `consultations_consultation_site_id_905836a5_fk_account_site_id` (`site_id`),
  CONSTRAINT `consultations_consul_item_passage_id_f6f6a6ec_fk_planning_` FOREIGN KEY (`item_passage_id`) REFERENCES `planning_itempassage` (`id`),
  CONSTRAINT `consultations_consul_medecin_id_28643c29_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `consultations_consultation_site_id_905836a5_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_consultation`
--

LOCK TABLES `consultations_consultation` WRITE;
/*!40000 ALTER TABLE `consultations_consultation` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_consultation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_ligneordonnance`
--

DROP TABLE IF EXISTS `consultations_ligneordonnance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_ligneordonnance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `texte` varchar(255) NOT NULL,
  `statut` varchar(20) NOT NULL,
  `ordre` int unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `medicament_id` bigint DEFAULT NULL,
  `ordonnance_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ligne_ordonnance_order` (`ordonnance_id`,`ordre`),
  KEY `consultations_ligneo_medicament_id_549cc34a_fk_stock_med` (`medicament_id`),
  CONSTRAINT `consultations_ligneo_medicament_id_549cc34a_fk_stock_med` FOREIGN KEY (`medicament_id`) REFERENCES `stock_medicament` (`id`),
  CONSTRAINT `consultations_ligneo_ordonnance_id_a67fd879_fk_consultat` FOREIGN KEY (`ordonnance_id`) REFERENCES `consultations_ordonnance` (`id`),
  CONSTRAINT `consultations_ligneordonnance_chk_1` CHECK ((`ordre` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_ligneordonnance`
--

LOCK TABLES `consultations_ligneordonnance` WRITE;
/*!40000 ALTER TABLE `consultations_ligneordonnance` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_ligneordonnance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_ordonnance`
--

DROP TABLE IF EXISTS `consultations_ordonnance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_ordonnance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_emission` date NOT NULL,
  `consultation_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_ordonn_consultation_id_e57836cf_fk_consultat` (`consultation_id`),
  CONSTRAINT `consultations_ordonn_consultation_id_e57836cf_fk_consultat` FOREIGN KEY (`consultation_id`) REFERENCES `consultations_consultation` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_ordonnance`
--

LOCK TABLES `consultations_ordonnance` WRITE;
/*!40000 ALTER TABLE `consultations_ordonnance` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_ordonnance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations_posologiestandard`
--

DROP TABLE IF EXISTS `consultations_posologiestandard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations_posologiestandard` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `texte` varchar(255) NOT NULL,
  `ordre` int unsigned NOT NULL,
  `actif` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `texte` (`texte`),
  CONSTRAINT `consultations_posologiestandard_chk_1` CHECK ((`ordre` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations_posologiestandard`
--

LOCK TABLES `consultations_posologiestandard` WRITE;
/*!40000 ALTER TABLE `consultations_posologiestandard` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations_posologiestandard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contre_visites`
--

DROP TABLE IF EXISTS `contre_visites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contre_visites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `numero_ordre` int unsigned NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `nom_prenom` varchar(255) NOT NULL,
  `duree_repos` int unsigned NOT NULL,
  `a_partir` date NOT NULL,
  `remarque` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `medecin_controleur_id` bigint DEFAULT NULL,
  `date` date NOT NULL,
  `item_passage_id` bigint DEFAULT NULL,
  `repos_initial` int unsigned DEFAULT NULL,
  `refus_repos` tinyint(1) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_passage_id` (`item_passage_id`),
  KEY `contre_visites_medecin_controleur_i_6673de09_fk_account_m` (`medecin_controleur_id`),
  KEY `contre_visites_site_id_cdeebb19_fk_account_site_id` (`site_id`),
  CONSTRAINT `contre_visites_item_passage_id_edaa9449_fk_planning_` FOREIGN KEY (`item_passage_id`) REFERENCES `planning_itempassage` (`id`),
  CONSTRAINT `contre_visites_medecin_controleur_i_6673de09_fk_account_m` FOREIGN KEY (`medecin_controleur_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `contre_visites_site_id_cdeebb19_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `contre_visites_chk_1` CHECK ((`numero_ordre` >= 0)),
  CONSTRAINT `contre_visites_chk_2` CHECK ((`duree_repos` >= 0)),
  CONSTRAINT `contre_visites_chk_3` CHECK ((`repos_initial` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contre_visites`
--

LOCK TABLES `contre_visites` WRITE;
/*!40000 ALTER TABLE `contre_visites` DISABLE KEYS */;
/*!40000 ALTER TABLE `contre_visites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `control_visits_demandeexpertise`
--

DROP TABLE IF EXISTS `control_visits_demandeexpertise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `control_visits_demandeexpertise` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `dr` longtext NOT NULL,
  `date_demande` date NOT NULL,
  `collaborateur_nom` varchar(255) NOT NULL,
  `collaborateur_prenom` varchar(255) NOT NULL,
  `collaborateur_matricule` varchar(50) NOT NULL,
  `pieces_jointes` longtext NOT NULL,
  `poste` varchar(255) NOT NULL,
  `autres_missions` longtext NOT NULL,
  `contre_visite_id` bigint DEFAULT NULL,
  `medecin_controleur_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `control_visits_deman_contre_visite_id_4862059b_fk_contre_vi` (`contre_visite_id`),
  KEY `control_visits_deman_medecin_controleur_i_7b4d3c8d_fk_account_m` (`medecin_controleur_id`),
  CONSTRAINT `control_visits_deman_contre_visite_id_4862059b_fk_contre_vi` FOREIGN KEY (`contre_visite_id`) REFERENCES `contre_visites` (`id`),
  CONSTRAINT `control_visits_deman_medecin_controleur_i_7b4d3c8d_fk_account_m` FOREIGN KEY (`medecin_controleur_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `control_visits_demandeexpertise`
--

LOCK TABLES `control_visits_demandeexpertise` WRITE;
/*!40000 ALTER TABLE `control_visits_demandeexpertise` DISABLE KEYS */;
/*!40000 ALTER TABLE `control_visits_demandeexpertise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `controles_medicaux`
--

DROP TABLE IF EXISTS `controles_medicaux`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controles_medicaux` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `numero_controle` varchar(50) NOT NULL,
  `date_emission` date NOT NULL,
  `envoye_rh` tinyint(1) NOT NULL,
  `date_envoi_rh` datetime(6) DEFAULT NULL,
  `contre_visite_id` bigint NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `avis_medecin_controleur` longtext NOT NULL DEFAULT (_utf8mb4'À compléter'),
  `matricule` varchar(50) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `prenom` varchar(150) NOT NULL,
  `repos_prescrit` varchar(200) NOT NULL,
  `segment` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_controle` (`numero_controle`),
  UNIQUE KEY `contre_visite_id` (`contre_visite_id`),
  CONSTRAINT `controles_medicaux_contre_visite_id_935ce397_fk_contre_vi` FOREIGN KEY (`contre_visite_id`) REFERENCES `contre_visites` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `controles_medicaux`
--

LOCK TABLES `controles_medicaux` WRITE;
/*!40000 ALTER TABLE `controles_medicaux` DISABLE KEYS */;
/*!40000 ALTER TABLE `controles_medicaux` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demandes_bilan`
--

DROP TABLE IF EXISTS `demandes_bilan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demandes_bilan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_demande` date NOT NULL,
  `fiche_aptitude_id` bigint DEFAULT NULL,
  `acide_urique` tinyint(1) NOT NULL,
  `cholesterol` tinyint(1) NOT NULL,
  `copro_parasitologique` tinyint(1) NOT NULL,
  `creatinine` tinyint(1) NOT NULL,
  `glycemie` tinyint(1) NOT NULL,
  `nfs` tinyint(1) NOT NULL,
  `transaminases` tinyint(1) NOT NULL,
  `triglycerides` tinyint(1) NOT NULL,
  `vs` tinyint(1) NOT NULL,
  `numero_labo` varchar(50) NOT NULL,
  `cin` varchar(50) NOT NULL,
  `renseignements_cliniques` longtext NOT NULL,
  `anemie` tinyint(1) NOT NULL,
  `anticoagulants` varchar(3) NOT NULL,
  `autre_atcd` varchar(255) NOT NULL,
  `chauffeur` tinyint(1) NOT NULL,
  `chimique` tinyint(1) NOT NULL,
  `depistage` tinyint(1) NOT NULL,
  `diabete` tinyint(1) NOT NULL,
  `dyslipidemie` tinyint(1) NOT NULL,
  `goutte` tinyint(1) NOT NULL,
  `hepatite` tinyint(1) NOT NULL,
  `hta` tinyint(1) NOT NULL,
  `infectieux` tinyint(1) NOT NULL,
  `ldl_hdl_cholesterol` tinyint(1) NOT NULL,
  `suivi_pathologies_chroniques` tinyint(1) NOT NULL,
  `travail_poste_nuit` tinyint(1) NOT NULL,
  `autres_risques` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `demandes_bilan_fiche_aptitude_id_0742eeb4_fk_fiches_aptitude_id` (`fiche_aptitude_id`),
  CONSTRAINT `demandes_bilan_fiche_aptitude_id_0742eeb4_fk_fiches_aptitude_id` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demandes_bilan`
--

LOCK TABLES `demandes_bilan` WRITE;
/*!40000 ALTER TABLE `demandes_bilan` DISABLE KEYS */;
/*!40000 ALTER TABLE `demandes_bilan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demandes_examen`
--

DROP TABLE IF EXISTS `demandes_examen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demandes_examen` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_demande` date NOT NULL,
  `fiche_aptitude_id` bigint DEFAULT NULL,
  `audiogramme` tinyint(1) NOT NULL,
  `ecg` tinyint(1) NOT NULL,
  `efr` tinyint(1) NOT NULL,
  `visiotest` tinyint(1) NOT NULL,
  `numero_examen` varchar(20) NOT NULL,
  `renseignements_cliniques` longtext NOT NULL,
  `microfilm` tinyint(1) NOT NULL,
  `risque_chauffeur` tinyint(1) NOT NULL,
  `risque_chimique` tinyint(1) NOT NULL,
  `risque_infectieux` tinyint(1) NOT NULL,
  `risque_physique` tinyint(1) NOT NULL,
  `spirometrie` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `demandes_examen_fiche_aptitude_id_adce0ff0_fk_fiches_aptitude_id` (`fiche_aptitude_id`),
  CONSTRAINT `demandes_examen_fiche_aptitude_id_adce0ff0_fk_fiches_aptitude_id` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demandes_examen`
--

LOCK TABLES `demandes_examen` WRITE;
/*!40000 ALTER TABLE `demandes_examen` DISABLE KEYS */;
/*!40000 ALTER TABLE `demandes_examen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2026-05-09 21:43:55.430098','1','traitant',1,'[{\"added\": {}}]',11,1),(2,'2026-05-09 21:44:00.971911','2','travail',1,'[{\"added\": {}}]',11,1),(3,'2026-05-09 21:44:10.075197','3','controleur',1,'[{\"added\": {}}]',11,1),(4,'2026-05-09 21:46:52.805438','2','safa',1,'[{\"added\": {}}]',4,1),(5,'2026-05-09 21:47:12.729239','3','ali',1,'[{\"added\": {}}]',4,1),(6,'2026-05-09 21:47:29.313085','4','nadia',1,'[{\"added\": {}}]',4,1),(7,'2026-05-09 21:47:45.260105','5','fatiha',1,'[{\"added\": {}}]',4,1),(8,'2026-05-09 21:47:59.072775','6','faten',1,'[{\"added\": {}}]',4,1),(9,'2026-05-09 21:48:18.052614','3','ali',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(10,'2026-05-09 21:48:28.287411','6','faten',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(11,'2026-05-09 21:48:42.390605','5','fatiha',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(12,'2026-05-09 21:48:51.251125','4','nadia',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(13,'2026-05-09 21:48:58.924479','2','safa',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(14,'2026-05-09 21:49:14.284913','6','faten',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(15,'2026-05-09 21:49:21.547401','5','fatiha',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(16,'2026-05-09 21:49:31.588576','4','nadia',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(17,'2026-05-09 21:49:40.601962','3','ali',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(18,'2026-05-09 21:49:46.310980','2','safa',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(19,'2026-05-09 21:50:08.962479','7','naira',1,'[{\"added\": {}}]',4,1),(20,'2026-05-09 21:50:18.371837','7','naira',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(21,'2026-05-09 21:50:47.220084','7','naira',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(22,'2026-05-09 21:51:04.244504','3','nadia',2,'[{\"changed\": {\"fields\": [\"Med type\", \"Site\", \"Specialite\", \"Numero ordre\"]}}]',13,1),(23,'2026-05-09 21:51:15.292660','2','fatiha',2,'[{\"changed\": {\"fields\": [\"Med type\", \"Site\", \"Specialite\", \"Numero ordre\"]}}]',13,1),(24,'2026-05-09 21:51:25.444851','1','faten',2,'[{\"changed\": {\"fields\": [\"Med type\", \"Site\", \"Specialite\", \"Numero ordre\"]}}]',13,1),(25,'2026-05-09 21:51:36.991932','2','naira',2,'[{\"changed\": {\"fields\": [\"Service\", \"Shift\", \"Site\"]}}]',14,1),(26,'2026-05-09 21:51:44.917198','1','safa',2,'[{\"changed\": {\"fields\": [\"Service\", \"Shift\", \"Site\"]}}]',14,1),(27,'2026-05-09 21:52:06.662139','8','marieù',1,'[{\"added\": {}}]',4,1),(28,'2026-05-09 21:52:16.858965','8','marieù',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(29,'2026-05-09 21:52:33.350234','8','mariem',2,'[{\"changed\": {\"fields\": [\"Username\"]}}]',4,1),(30,'2026-05-09 21:52:38.253519','8','mariem',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(31,'2026-05-09 21:52:49.254569','3','mariem',2,'[{\"changed\": {\"fields\": [\"Service\", \"Shift\", \"Site\"]}}]',14,1),(32,'2026-05-09 21:53:15.498505','9','Youssef',1,'[{\"added\": {}}]',4,1),(33,'2026-05-09 21:53:23.175742','9','Youssef',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(34,'2026-05-09 21:53:31.827587','9','Youssef',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(35,'2026-05-09 21:53:43.674229','2','Youssef',2,'[{\"changed\": {\"fields\": [\"Departement\", \"Site\"]}}]',16,1),(36,'2026-05-09 21:53:54.452373','1','ali',2,'[{\"changed\": {\"fields\": [\"Departement\", \"Site\"]}}]',16,1),(37,'2026-05-09 21:54:10.017753','10','yassine',1,'[{\"added\": {}}]',4,1),(38,'2026-05-09 21:54:21.218770','10','yassine',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(39,'2026-05-09 21:54:28.439192','10','yassine',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(40,'2026-05-09 21:54:37.551545','3','yassine',2,'[{\"changed\": {\"fields\": [\"Departement\", \"Site\"]}}]',16,1),(41,'2026-05-09 21:57:47.632482','11','idriss',1,'[{\"added\": {}}]',4,1),(42,'2026-05-09 21:57:55.958399','11','idriss',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(43,'2026-05-09 21:58:13.670308','12','sedki',1,'[{\"added\": {}}]',4,1),(44,'2026-05-09 21:58:21.415480','12','sedki',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(45,'2026-05-09 21:58:42.728634','13','sofien',1,'[{\"added\": {}}]',4,1),(46,'2026-05-09 21:58:51.825679','13','sofien',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(47,'2026-05-09 21:59:06.091915','13','sofien',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(48,'2026-05-09 21:59:14.573377','12','sedki',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(49,'2026-05-09 21:59:25.378532','11','idriss',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(50,'2026-05-09 21:59:41.152789','3','idriss',2,'[{\"changed\": {\"fields\": [\"Zone\", \"Certification\", \"Site\"]}}]',15,1),(51,'2026-05-09 21:59:55.191501','2','sedki',2,'[{\"changed\": {\"fields\": [\"Zone\", \"Certification\", \"Site\"]}}]',15,1),(52,'2026-05-09 22:00:01.726563','1','sofien',2,'[{\"changed\": {\"fields\": [\"Zone\", \"Certification\", \"Site\"]}}]',15,1),(53,'2026-05-09 22:24:33.054554','2','Leoni Massadine',2,'[{\"changed\": {\"fields\": [\"Raison sociale\", \"Nature d\'activit\\u00e9\", \"Num\\u00e9ro CNSS Entreprise\", \"Adresse entreprise\", \"Qualifications\", \"Num\\u00e9ro CNSS\"]}}]',17,1),(54,'2026-05-09 22:25:34.477709','3','Leoni Mateur',2,'[{\"changed\": {\"fields\": [\"Template key\", \"Raison sociale\", \"Nature d\'activit\\u00e9\", \"Num\\u00e9ro CNSS Entreprise\", \"Adresse entreprise\", \"Qualifications\", \"Num\\u00e9ro CNSS\"]}}]',17,1),(55,'2026-05-09 22:26:02.142756','1','Leoni Menzel Hayet',2,'[{\"changed\": {\"fields\": [\"Raison sociale\", \"Nature d\'activit\\u00e9\", \"Num\\u00e9ro CNSS Entreprise\", \"Adresse entreprise\", \"Qualifications\", \"Num\\u00e9ro CNSS\"]}}]',17,1),(56,'2026-05-16 20:22:28.318611','14','sallem',1,'[{\"added\": {}}]',4,1),(57,'2026-05-16 20:22:36.818793','14','sallem',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(58,'2026-05-16 20:22:44.731109','14','sallem',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(59,'2026-05-16 20:23:04.501437','4','sallem',2,'[{\"changed\": {\"fields\": [\"Med type\", \"Site\", \"Specialite\", \"Numero ordre\"]}}]',13,1),(60,'2026-05-18 21:03:26.189513','15','salah',1,'[{\"added\": {}}]',4,1),(61,'2026-05-18 21:03:31.446797','15','salah',2,'[{\"changed\": {\"fields\": [\"First name\", \"Last name\"]}}]',4,1),(62,'2026-05-18 21:03:37.640110','15','salah',2,'[{\"changed\": {\"fields\": [\"Role\", \"Phone\"]}}]',12,1),(63,'2026-05-18 21:03:52.523215','5','salah',2,'[{\"changed\": {\"fields\": [\"Med type\", \"Site\", \"Specialite\", \"Numero ordre\"]}}]',13,1);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (15,'account','hsee'),(14,'account','infirmier'),(13,'account','medecin'),(11,'account','medtype'),(12,'account','profile'),(16,'account','rh'),(17,'account','site'),(53,'act_infirmier','absencemedecin'),(47,'act_infirmier','accidenttravail'),(51,'act_infirmier','declarationcnam'),(57,'act_infirmier','documentmedicalscanne'),(56,'act_infirmier','enqueteaccident'),(49,'act_infirmier','incidentavecbon'),(50,'act_infirmier','incidentsansbon'),(58,'act_infirmier','maladiechronique'),(48,'act_infirmier','maladieprofessionnelle'),(55,'act_infirmier','ordretransport'),(54,'act_infirmier','pointagemedecin'),(59,'act_infirmier','rendezvouspsychologue'),(60,'act_infirmier','rendezvoussagefemme'),(52,'act_infirmier','transferturgence'),(1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(7,'authtoken','token'),(8,'authtoken','tokenproxy'),(26,'consultations','certificataptitudegenerale'),(27,'consultations','certificatbonnesante'),(28,'consultations','certificatexemption'),(22,'consultations','certificatmedical'),(29,'consultations','certificatpermisconduire'),(30,'consultations','certificatprenuptial'),(21,'consultations','consultation'),(24,'consultations','ligneordonnance'),(23,'consultations','ordonnance'),(25,'consultations','posologiestandard'),(5,'contenttypes','contenttype'),(41,'control_visits','contrevisite'),(40,'control_visits','controlemedical'),(42,'control_visits','demandeexpertise'),(44,'control_visits','lignecontrevisite'),(43,'control_visits','listecontrevisite'),(66,'embauche','candidatembauche'),(65,'embauche','listeembauche'),(18,'employees','collaborateur'),(19,'employees','resourceim'),(72,'hsee','equipementmedicalendommage'),(73,'hsee','notificationhsse'),(71,'hsee','parametrehseemensuel'),(20,'medical_records','dossiermedical'),(34,'medical_work','certificataptitude'),(38,'medical_work','certificataptitudemateur'),(33,'medical_work','demandebilan'),(32,'medical_work','demandeexamen'),(31,'medical_work','ficheaptitude'),(37,'medical_work','ficheliaison'),(39,'medical_work','fichesurveillancespecialemateur'),(36,'medical_work','ordonnance'),(35,'medical_work','remarqueinfirmier'),(46,'planning','itempassage'),(45,'planning','listepassage'),(6,'sessions','session'),(63,'stock','acteinfirmier'),(61,'stock','medicament'),(64,'stock','mouvementstock'),(62,'stock','stockmedicament'),(70,'surveillance_speciale','lignesurveillancespeciale'),(69,'surveillance_speciale','listesurveillancespeciale'),(9,'token_blacklist','blacklistedtoken'),(10,'token_blacklist','outstandingtoken'),(68,'visites_periodiques','lignevisiteperiodique'),(67,'visites_periodiques','listevisiteperiodique');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-05-09 21:40:34.325702'),(2,'auth','0001_initial','2026-05-09 21:40:34.791127'),(3,'account','0001_initial','2026-05-09 21:40:35.139489'),(4,'account','0002_profile_must_change_password','2026-05-09 21:40:35.168461'),(5,'account','0003_create_groups_and_permissions','2026-05-09 21:40:35.194619'),(6,'account','0004_medecin_heures_par_defaut','2026-05-09 21:40:35.245361'),(7,'account','0005_medecin_adresse_cabinet_and_more','2026-05-09 21:40:35.283797'),(8,'account','0006_remove_medecin_adresse_cabinet_and_more','2026-05-09 21:40:35.360173'),(9,'account','0007_site_medecin_site','2026-05-09 21:40:35.436614'),(10,'account','0008_seed_sites','2026-05-09 21:40:35.450602'),(11,'account','0009_update_site_details','2026-05-09 21:40:35.464432'),(12,'account','0010_update_site_template_keys','2026-05-09 21:40:35.492512'),(13,'account','0011_hsee_site_infirmier_site_rh_site','2026-05-09 21:40:35.624442'),(14,'account','0012_medecin_nom_ar_medecin_prenom_ar','2026-05-09 21:40:35.672929'),(15,'account','0013_site_nature_activite_site_numero_cnss_and_more','2026-05-09 21:40:35.756231'),(16,'account','0014_site_entreprise_fields','2026-05-09 21:40:35.825798'),(17,'account','0015_rename_mater_to_mateur','2026-05-09 21:40:35.839570'),(18,'employees','0001_initial','2026-05-09 21:40:35.881331'),(19,'employees','0002_rename_num_portable_collaborateur_telephone_and_more','2026-05-09 21:40:35.936041'),(20,'employees','0003_remove_collaborateur_photo','2026-05-09 21:40:35.943882'),(21,'employees','0004_collaborateur_cin_collaborateur_lieu_naissance_and_more','2026-05-09 21:40:36.020354'),(22,'employees','0005_collaborateur_numero_cnss','2026-05-09 21:40:36.041257'),(23,'employees','0006_collaborateur_plant_section_collaborateur_segment','2026-05-09 21:40:36.075789'),(24,'employees','0007_resourceim','2026-05-09 21:40:36.078333'),(25,'employees','0008_remove_collaborateur_adresse_and_more','2026-05-09 21:40:36.179928'),(26,'employees','0009_remove_collaborateur_cin_and_more','2026-05-09 21:40:36.201089'),(27,'act_infirmier','0001_initial','2026-05-09 21:40:36.314855'),(28,'act_infirmier','0002_accidenttravail_num_cnam_and_more','2026-05-09 21:40:36.457284'),(29,'act_infirmier','0003_maladieprofessionnelle','2026-05-09 21:40:36.610509'),(30,'act_infirmier','0004_maladieprofessionnelle_anciennete_and_more','2026-05-09 21:40:36.763090'),(31,'act_infirmier','0005_accidenttravail_total_jour_perdu','2026-05-09 21:40:36.825021'),(32,'act_infirmier','0006_incidentavecbon_incidentsansbon','2026-05-09 21:40:37.012414'),(33,'act_infirmier','0007_incidentavecbon_updates','2026-05-09 21:40:37.151261'),(34,'act_infirmier','0008_transferturgence_declarationcnam','2026-05-09 21:40:37.360083'),(35,'act_infirmier','0009_pointagemedecin_absencemedecin','2026-05-09 21:40:37.588764'),(36,'act_infirmier','0010_ordretransport','2026-05-09 21:40:37.728647'),(37,'act_infirmier','0011_alter_transferturgence_num_ordre','2026-05-09 21:40:37.770353'),(38,'act_infirmier','0012_enqueteaccident','2026-05-09 21:40:37.874506'),(39,'act_infirmier','0013_accidenttravail_categorie_accident','2026-05-09 21:40:37.937836'),(40,'act_infirmier','0014_documentmedicalscanne','2026-05-09 21:40:38.089623'),(41,'act_infirmier','0015_alter_documentmedicalscanne_matricule_ref','2026-05-09 21:40:38.103375'),(42,'act_infirmier','0016_maladiechronique_rendezvouspsychologue_and_more','2026-05-09 21:40:38.438761'),(43,'act_infirmier','0017_rendezvoussagefemme_motif_rdv','2026-05-09 21:40:38.471029'),(44,'act_infirmier','0018_add_site_fields','2026-05-09 21:40:39.117743'),(45,'act_infirmier','0019_rendezvouspsychologue_secteur_collaborateur_and_more','2026-05-09 21:40:39.346378'),(46,'act_infirmier','0020_maladieprofessionnelle_is_tms','2026-05-09 21:40:39.387742'),(47,'act_infirmier','0021_transferturgence_telephone_chauffeur_sms','2026-05-09 21:40:39.470946'),(48,'act_infirmier','0022_criticite_choices','2026-05-09 21:40:39.624485'),(49,'act_infirmier','0023_accidenttravail_criticite_quatre_niveaux','2026-05-09 21:40:39.659272'),(50,'admin','0001_initial','2026-05-09 21:40:39.763374'),(51,'admin','0002_logentry_remove_auto_add','2026-05-09 21:40:39.783918'),(52,'admin','0003_logentry_add_action_flag_choices','2026-05-09 21:40:39.799046'),(53,'contenttypes','0002_remove_content_type_name','2026-05-09 21:40:39.874163'),(54,'auth','0002_alter_permission_name_max_length','2026-05-09 21:40:39.942755'),(55,'auth','0003_alter_user_email_max_length','2026-05-09 21:40:39.992308'),(56,'auth','0004_alter_user_username_opts','2026-05-09 21:40:40.006161'),(57,'auth','0005_alter_user_last_login_null','2026-05-09 21:40:40.089376'),(58,'auth','0006_require_contenttypes_0002','2026-05-09 21:40:40.089376'),(59,'auth','0007_alter_validators_add_error_messages','2026-05-09 21:40:40.103856'),(60,'auth','0008_alter_user_username_max_length','2026-05-09 21:40:40.192805'),(61,'auth','0009_alter_user_last_name_max_length','2026-05-09 21:40:40.276545'),(62,'auth','0010_alter_group_name_max_length','2026-05-09 21:40:40.304076'),(63,'auth','0011_update_proxy_permissions','2026-05-09 21:40:40.319033'),(64,'auth','0012_alter_user_first_name_max_length','2026-05-09 21:40:40.408239'),(65,'authtoken','0001_initial','2026-05-09 21:40:40.470977'),(66,'authtoken','0002_auto_20160226_1747','2026-05-09 21:40:40.590617'),(67,'authtoken','0003_tokenproxy','2026-05-09 21:40:40.595781'),(68,'authtoken','0004_alter_tokenproxy_options','2026-05-09 21:40:40.603425'),(69,'planning','0001_initial','2026-05-09 21:40:40.790677'),(70,'planning','0002_alter_itempassage_collaborateur','2026-05-09 21:40:40.867111'),(71,'planning','0003_alter_listepassage_session','2026-05-09 21:40:40.874120'),(72,'consultations','0001_initial','2026-05-09 21:40:41.117097'),(73,'consultations','0002_ligne_ordonnance','2026-05-09 21:40:41.276413'),(74,'stock','0001_initial','2026-05-09 21:40:41.547930'),(75,'consultations','0003_update_medicament_fk','2026-05-09 21:40:41.665870'),(76,'consultations','0004_alter_ordonnance_consultation','2026-05-09 21:40:41.831512'),(77,'consultations','0005_alter_ligneordonnance_statut','2026-05-09 21:40:41.832323'),(78,'consultations','0006_posologiestandard','2026-05-09 21:40:41.860310'),(79,'consultations','0007_certificataptitudegenerale_certificatbonnesante_and_more','2026-05-09 21:40:42.228155'),(80,'consultations','0008_certificataptitudegenerale_nom_prenom_medecin_and_more','2026-05-09 21:40:42.352818'),(81,'consultations','0009_certificatbonnesante_destinataire_and_more','2026-05-09 21:40:42.631005'),(82,'consultations','0010_alter_certificatpermisconduire_cin_date_and_more','2026-05-09 21:40:42.645650'),(83,'consultations','0011_remove_certificatexemption_type_exemption_and_more','2026-05-09 21:40:42.833489'),(84,'consultations','0012_alter_certificatpermisconduire_cin_date','2026-05-09 21:40:42.929597'),(85,'consultations','0013_remove_certificatbonnesante_apte_collectivite_and_more','2026-05-09 21:40:43.021392'),(86,'consultations','0014_certificatpermisconduire_adresse_medecin_and_more','2026-05-09 21:40:43.151738'),(87,'consultations','0015_remove_certificatprenuptial_attire_attention_rubeole_and_more','2026-05-09 21:40:43.283347'),(88,'consultations','0016_certificatpermisconduire_adresse_residence','2026-05-09 21:40:43.311237'),(89,'consultations','0017_certificatprenuptial_cin_date_and_more','2026-05-09 21:40:43.352738'),(90,'consultations','0018_alter_certificatprenuptial_lieu_exercice_medecin','2026-05-09 21:40:43.359851'),(91,'consultations','0019_alter_certificatprenuptial_ville_medecin','2026-05-09 21:40:43.374563'),(92,'consultations','0020_alter_certificatprenuptial_groupe_sanguin_fait_and_more','2026-05-09 21:40:43.402330'),(93,'consultations','0021_remove_certificatpermisconduire_adresse_medecin_and_more','2026-05-09 21:40:43.693422'),(94,'consultations','0022_alter_certificatprenuptial_adresse_medecin_and_more','2026-05-09 21:40:43.812925'),(95,'consultations','0023_alter_certificatprenuptial_adresse_medecin','2026-05-09 21:40:43.818865'),(96,'consultations','0024_consultation_site','2026-05-09 21:40:43.915691'),(97,'consultations','0003_auto_link_medicaments','2026-05-09 21:40:43.943547'),(98,'consultations','0025_merge_20260430_1121','2026-05-09 21:40:43.943547'),(99,'control_visits','0001_initial','2026-05-09 21:40:44.096185'),(100,'control_visits','0002_initial','2026-05-09 21:40:44.338804'),(101,'control_visits','0003_controlemedical_date_creation_and_more','2026-05-09 21:40:44.729347'),(102,'control_visits','0004_alter_contrevisite_options_and_more','2026-05-09 21:40:45.338606'),(103,'control_visits','0005_contrevisite_item_passage_alter_contrevisite_docteur_and_more','2026-05-09 21:40:45.507076'),(104,'control_visits','0006_remove_controlemedical_email_rh_and_more','2026-05-09 21:40:45.727930'),(105,'control_visits','0007_remove_contrevisite_docteur_and_more','2026-05-09 21:40:45.776371'),(106,'control_visits','0008_remove_controlemedical_fichier_pdf_demandeexpertise','2026-05-09 21:40:45.901691'),(107,'control_visits','0009_contrevisite_repos_initial_and_more','2026-05-09 21:40:45.963973'),(108,'control_visits','0010_contrevisite_refus_repos','2026-05-09 21:40:45.999827'),(109,'control_visits','0011_contrevisite_site','2026-05-09 21:40:46.075147'),(110,'control_visits','0012_listecontrevisite_lignecontrevisite','2026-05-09 21:40:46.401181'),(111,'control_visits','0013_listecontrevisite_sms_veille_ligne_sms_jour_j','2026-05-09 21:40:46.477376'),(112,'control_visits','0014_ligne_cv_ordre_unique','2026-05-09 21:40:46.644477'),(113,'control_visits','0015_alter_lignecontrevisite_options_and_more','2026-05-09 21:40:46.672221'),(114,'control_visits','0016_listecontrevisite_statut_archivee','2026-05-09 21:40:46.694466'),(115,'medical_work','0001_initial','2026-05-09 21:40:47.102877'),(116,'medical_work','0002_remove_certificataptitude_amenagement_poste_and_more','2026-05-09 21:40:48.832303'),(117,'medical_work','0003_remove_demandebilan_date_resultat_and_more','2026-05-09 21:40:49.130456'),(118,'medical_work','0004_ficheaptitude_matricule','2026-05-09 21:40:49.185582'),(119,'medical_work','0005_medecin_travail_permissions','2026-05-09 21:40:49.221389'),(120,'medical_work','0006_remove_demandebilan_age_and_more','2026-05-09 21:40:49.706239'),(121,'medical_work','0007_demandebilan_age_demandeexamen_age','2026-05-09 21:40:49.790293'),(122,'medical_work','0008_rename_cholestorol_demandebilan_cholesterol_and_more','2026-05-09 21:40:49.984661'),(123,'medical_work','0009_remove_demandebilan_nom_entreprise_and_more','2026-05-09 21:40:50.081854'),(124,'medical_work','0010_demandeexamen_numero_examen','2026-05-09 21:40:50.102598'),(125,'medical_work','0011_populate_demandeexamen_numero_examen','2026-05-09 21:40:50.138778'),(126,'medical_work','0012_remove_ficheaptitude_numero_cnss_and_more','2026-05-09 21:40:50.220340'),(127,'medical_work','0013_demandebilan_cin','2026-05-09 21:40:50.243558'),(128,'medical_work','0014_alter_demandebilan_cin','2026-05-09 21:40:50.250084'),(129,'medical_work','0015_remove_demandebilan_renseignements_cliniques_and_more','2026-05-09 21:40:50.276664'),(130,'embauche','0001_initial','2026-05-09 21:40:50.553954'),(131,'embauche','0002_add_missing_fields_to_candidat','2026-05-09 21:40:51.018627'),(132,'embauche','0003_add_statut_integration','2026-05-09 21:40:51.053948'),(133,'embauche','0004_add_visite_embauche_and_fk_liste_embauche','2026-05-09 21:40:51.130413'),(134,'embauche','0005_revert_fk_liste_passage','2026-05-09 21:40:51.220634'),(135,'embauche','0006_add_medecin_to_liste_embauche','2026-05-09 21:40:51.303633'),(136,'embauche','0007_alter_listeembauche_date_visite','2026-05-09 21:40:51.352111'),(137,'embauche','0008_alter_listeembauche_statut_archivee','2026-05-09 21:40:51.429662'),(138,'embauche','0009_candidatembauche_numero_cnss','2026-05-09 21:40:51.470159'),(139,'embauche','0010_liste_embauche_sms_veille_candidat_sms_jour_j','2026-05-09 21:40:51.546970'),(140,'hsee','0001_initial','2026-05-09 21:40:51.588762'),(141,'hsee','0002_alter_equipementmedicalendommage_options_and_more','2026-05-09 21:40:51.588762'),(142,'hsee','0003_notificationhsse','2026-05-09 21:40:51.720566'),(143,'hsee','0004_parametre_hsee_site','2026-05-09 21:40:51.874146'),(144,'hsee','0005_equipement_site','2026-05-09 21:40:51.985997'),(145,'medical_records','0001_initial','2026-05-09 21:40:52.087880'),(146,'medical_records','0002_remove_dossiermedical_antecedents_and_more','2026-05-09 21:40:52.782164'),(147,'medical_records','0003_dossiermedical_alcool_dossiermedical_automedication_and_more','2026-05-09 21:40:52.866250'),(148,'medical_records','0004_alter_dossiermedical_collaborateur','2026-05-09 21:40:53.109415'),(149,'medical_records','0005_add_matricule_ref_dossier','2026-05-09 21:40:53.136276'),(150,'medical_records','0006_add_site_to_dossiermedical','2026-05-09 21:40:53.250491'),(151,'surveillance_speciale','0001_initial','2026-05-09 21:40:53.644436'),(152,'surveillance_speciale','0002_listesurveillancespeciale_statut_archivee','2026-05-09 21:40:53.664850'),(153,'medical_work','0016_collaborateur_nullable_fiche_aptitude','2026-05-09 21:40:53.831521'),(154,'medical_work','0017_nullable_fiche_for_embauche_requests','2026-05-09 21:40:54.129313'),(155,'medical_work','0018_renseignements_cliniques_demandes','2026-05-09 21:40:54.158026'),(156,'medical_work','0018_ficheaptitude_matricule','2026-05-09 21:40:54.213489'),(157,'medical_work','0019_merge_20260327_2327','2026-05-09 21:40:54.220600'),(158,'medical_work','0020_ficheaptitude_numero_cnss_salarie','2026-05-09 21:40:54.268480'),(159,'medical_work','0021_remarqueinfirmier','2026-05-09 21:40:54.407574'),(160,'visites_periodiques','0001_initial','2026-05-09 21:40:54.736062'),(161,'medical_work','0022_ficheaptitude_ligne_visite_periodique','2026-05-09 21:40:54.831764'),(162,'medical_work','0023_ficheaptitude_site','2026-05-09 21:40:54.935565'),(163,'medical_work','0024_add_sousse_fields_bilan_examen','2026-05-09 21:40:55.545948'),(164,'medical_work','0025_create_ordonnance_fiche_liaison','2026-05-09 21:40:55.727296'),(165,'medical_work','0026_ficheaptitude_sousse_fields','2026-05-09 21:40:55.921860'),(166,'medical_work','0027_ficheaptitude_champs_sousse','2026-05-09 21:40:56.109519'),(167,'medical_work','0028_alter_ficheaptitude_aptitude_choices','2026-05-09 21:40:56.138196'),(168,'medical_work','0029_restore_ficheaptitude_vp_fields','2026-05-09 21:40:56.415021'),(169,'medical_work','0030_ficheaptitude_observations_complementaires','2026-05-09 21:40:56.469810'),(170,'medical_work','0031_ficheaptitude_ligne_surveillance_speciale','2026-05-09 21:40:56.574585'),(171,'medical_work','0032_add_surveillance_speciale_type_visite','2026-05-09 21:40:56.630641'),(172,'medical_work','0033_alter_ficheaptitude_date_reprise','2026-05-09 21:40:56.789702'),(173,'medical_work','0034_ficheaptitude_examens_ulterieurs_and_more','2026-05-09 21:40:56.991069'),(174,'medical_work','0035_remove_certificataptitudemateur_payload_and_more','2026-05-09 21:40:57.469709'),(175,'medical_work','0036_certificataptitudemateur_collaborateur_and_more','2026-05-09 21:40:57.699359'),(176,'medical_work','0037_fichesurveillancespecialemateur','2026-05-09 21:40:57.962375'),(177,'medical_work','0038_certificataptitudemateur_entete_certificat_medical_aptitude_and_more','2026-05-09 21:40:58.054007'),(178,'medical_work','0039_migrate_demandebilan_autres_risques_to_text','2026-05-09 21:40:58.172316'),(179,'planning','0004_add_visite_embauche_and_fk_liste_embauche','2026-05-09 21:40:58.268491'),(180,'planning','0005_revert_liste_passage_embauche','2026-05-09 21:40:58.379322'),(181,'planning','0006_itempassage_sms_envoye','2026-05-09 21:40:58.421226'),(182,'sessions','0001_initial','2026-05-09 21:40:58.448945'),(183,'stock','0002_mouvementstock','2026-05-09 21:40:58.685307'),(184,'stock','0003_medicament_unite','2026-05-09 21:40:58.713078'),(185,'stock','0004_acteinfirmier_type_acte_and_more','2026-05-09 21:40:58.913729'),(186,'stock','0005_medicament_conditionnement_and_more','2026-05-09 21:40:58.984119'),(187,'stock','0006_medicament_conditionnement_personnalise_and_more','2026-05-09 21:40:59.018751'),(188,'stock','0007_mouvementstock_collaborateur','2026-05-09 21:40:59.108902'),(189,'stock','0008_alter_medicament_conditionnement_and_more','2026-05-09 21:40:59.122941'),(190,'stock','0009_medicament_unite_autre','2026-05-09 21:40:59.163801'),(191,'stock','0010_add_stock_site','2026-05-09 21:40:59.379660'),(192,'stock','0011_medicament_site','2026-05-09 21:40:59.720067'),(193,'token_blacklist','0001_initial','2026-05-09 21:40:59.928334'),(194,'token_blacklist','0002_outstandingtoken_jti_hex','2026-05-09 21:40:59.956134'),(195,'token_blacklist','0003_auto_20171017_2007','2026-05-09 21:41:00.005547'),(196,'token_blacklist','0004_auto_20171017_2013','2026-05-09 21:41:00.073307'),(197,'token_blacklist','0005_remove_outstandingtoken_jti','2026-05-09 21:41:00.129765'),(198,'token_blacklist','0006_auto_20171017_2113','2026-05-09 21:41:00.157485'),(199,'token_blacklist','0007_auto_20171017_2214','2026-05-09 21:41:00.414294'),(200,'token_blacklist','0008_migrate_to_bigautofield','2026-05-09 21:41:00.616016'),(201,'token_blacklist','0010_fix_migrate_to_bigautofield','2026-05-09 21:41:00.663808'),(202,'token_blacklist','0011_linearizes_history','2026-05-09 21:41:00.665165'),(203,'token_blacklist','0012_alter_outstandingtoken_user','2026-05-09 21:41:00.706723'),(204,'token_blacklist','0013_alter_blacklistedtoken_options_and_more','2026-05-09 21:41:00.733884'),(205,'visites_periodiques','0002_liste_vp_sms_veille_ligne_sms_jour_j','2026-05-09 21:41:00.817361'),(206,'medical_records','0007_dossier_jort_quatre_pages','2026-05-13 11:06:13.367436'),(207,'account','0016_add_menzel_hayet_template_key','2026-05-19 14:13:49.209677');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('g9001j214e7pccfjsmcdi5qv9nczgfgy','.eJxVjMsOwiAUBf-FtSE8CrQu3fsN5D5AqgaS0q6M_65NutDtmZnzEhG2tcStpyXOLM5Ci9PvhkCPVHfAd6i3JqnVdZlR7oo8aJfXxul5Ody_gwK9fGviiVwelUZW7AMmY0LIODokHoLV3mJggAFdBkoIxoIyTG4iC854Jd4fDAQ41w:1wLpSZ:4S5A9belP8JbHnrEPqStZzfXg_kQvBexmCTqL-jtjHo','2026-05-23 21:43:43.090943');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `embauche_candidatembauche`
--

DROP TABLE IF EXISTS `embauche_candidatembauche`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `embauche_candidatembauche` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ligne_source` int unsigned NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `prenom` varchar(150) NOT NULL,
  `cin` varchar(20) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `poste` varchar(150) NOT NULL,
  `department` varchar(150) NOT NULL,
  `telephone` varchar(30) NOT NULL,
  `presence` varchar(20) NOT NULL,
  `etat_embauche` varchar(20) NOT NULL,
  `observations_medecin` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `fiche_aptitude_id` bigint DEFAULT NULL,
  `liste_id` bigint NOT NULL,
  `centre_cout` varchar(100) NOT NULL,
  `date_recrutement` date DEFAULT NULL,
  `formation` varchar(100) NOT NULL,
  `genre` varchar(10) NOT NULL,
  `gouvernorat` varchar(100) NOT NULL,
  `niveau` varchar(100) NOT NULL,
  `num_demande` varchar(50) NOT NULL,
  `projet` varchar(100) NOT NULL,
  `ps` varchar(100) NOT NULL,
  `source_information` varchar(200) NOT NULL,
  `statut_integration` varchar(30) NOT NULL,
  `numero_cnss` varchar(50) NOT NULL,
  `sms_jour_j_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `embauche_candidatemb_collaborateur_id_bad968b6_fk_employees` (`collaborateur_id`),
  KEY `embauche_candidatemb_fiche_aptitude_id_0252cafa_fk_fiches_ap` (`fiche_aptitude_id`),
  KEY `embauche_candidatemb_liste_id_b02d9bb8_fk_embauche_` (`liste_id`),
  CONSTRAINT `embauche_candidatemb_collaborateur_id_bad968b6_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `embauche_candidatemb_fiche_aptitude_id_0252cafa_fk_fiches_ap` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`),
  CONSTRAINT `embauche_candidatemb_liste_id_b02d9bb8_fk_embauche_` FOREIGN KEY (`liste_id`) REFERENCES `embauche_listeembauche` (`id`),
  CONSTRAINT `embauche_candidatembauche_chk_1` CHECK ((`ligne_source` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `embauche_candidatembauche`
--

LOCK TABLES `embauche_candidatembauche` WRITE;
/*!40000 ALTER TABLE `embauche_candidatembauche` DISABLE KEYS */;
INSERT INTO `embauche_candidatembauche` VALUES (1,2,'100','safa','najjar','12345','2000-04-12','PROD18 Operator Electrical Test','IT','56683140','PRESENT','APTE','Apte','2026-05-09 22:19:49.281893',1,1,1,'421454','2026-01-29','05h30','homme','Mahdia','1 AS (NR)','22456','MH2','MH2>G-505','Karkar/2042/1337','INTEGRE','',1),(2,2,'101','wiem','hamila','0012345','2000-04-12','PROD18 Operator Electrical Test','IT','56683140','PRESENT','APTE','apttte','2026-05-09 23:10:20.794182',2,3,2,'421454','2026-01-29','05h30','homme','Mahdia','1 AS (NR)','22456','MH2','MH2>G-505','Karkar/2042/1337','INTEGRE','',1),(3,2,'102','Ali','najjar','12005','2000-04-12','PROD18 Operator Electrical Test','IT','56683140','PRESENT','APTE','apte avec succés','2026-05-09 23:20:34.013512',3,4,3,'421454','2026-01-29','05h30','homme','Mahdia','1 AS (NR)','22456','MH2','MH2>G-505','Karkar/2042/1337','INTEGRE','',1),(4,2,'103','yassmine','mhadhbi','1230045','2000-04-12','PROD18 Operator Electrical Test','','56683140','PRESENT','EN_ATTENTE','','2026-05-13 11:19:58.068687',NULL,NULL,4,'421454','2026-01-29','05h30','homme','Mahdia','1 AS (NR)','22456','MH2','MH2>G-505','Karkar/2042/1337','EN_ATTENTE_VISITE','',1),(5,2,'104','youssef','ben jomaa','0089876','2000-04-12','PROD18 Operator Electrical Test','','56683140','PRESENT','EN_ATTENTE','','2026-05-19 14:20:49.281766',NULL,NULL,5,'421454','2026-01-29','05h30','homme','Mahdia','1 AS (NR)','22456','MH2','MH2>G-505','Karkar/2042/1337','EN_ATTENTE_VISITE','',1);
/*!40000 ALTER TABLE `embauche_candidatembauche` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `embauche_listeembauche`
--

DROP TABLE IF EXISTS `embauche_listeembauche`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `embauche_listeembauche` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(20) NOT NULL,
  `date_visite` date DEFAULT NULL,
  `statut` varchar(20) NOT NULL,
  `fichier_excel` varchar(100) DEFAULT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `cree_par_id` bigint DEFAULT NULL,
  `medecin_id` bigint DEFAULT NULL,
  `sms_veille_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `embauche_listeembauc_cree_par_id_ba673c7a_fk_account_p` (`cree_par_id`),
  KEY `embauche_listeembauche_medecin_id_01b7a5a5_fk_account_medecin_id` (`medecin_id`),
  CONSTRAINT `embauche_listeembauc_cree_par_id_ba673c7a_fk_account_p` FOREIGN KEY (`cree_par_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `embauche_listeembauche_medecin_id_01b7a5a5_fk_account_medecin_id` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `embauche_listeembauche`
--

LOCK TABLES `embauche_listeembauche` WRITE;
/*!40000 ALTER TABLE `embauche_listeembauche` DISABLE KEYS */;
INSERT INTO `embauche_listeembauche` VALUES (1,'EMB-2026-001','2026-05-09','CLOTUREE','embauche/liste_Embauche_8fN0BQk.xlsx','2026-05-09 22:19:37.089753','2026-05-09 23:02:02.284621',3,1,0),(2,'EMB-2026-002','2026-05-09','CLOTUREE','embauche/liste_Embauche_PzgQrr4.xlsx','2026-05-09 23:09:46.417341','2026-05-09 23:13:38.647443',9,3,0),(3,'EMB-2026-003','2026-05-09','CLOTUREE','embauche/liste_Embauche_nnLDVjH.xlsx','2026-05-09 23:20:07.611401','2026-05-09 23:25:07.591246',10,2,1),(4,'EMB-2026-004','2026-05-13','EN_TRAITEMENT','embauche/liste_Embauche_v5uemYe.xlsx','2026-05-13 11:19:52.714909','2026-05-13 11:20:56.886959',3,1,0),(5,'EMB-2026-005','2026-05-19','EN_TRAITEMENT','embauche/liste_Embauche_853CO7P.xlsx','2026-05-19 14:19:32.829734','2026-05-19 14:21:43.025913',10,2,0);
/*!40000 ALTER TABLE `embauche_listeembauche` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees_collaborateur`
--

DROP TABLE IF EXISTS `employees_collaborateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees_collaborateur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `matricule` varchar(50) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `date_embauche` date DEFAULT NULL,
  `sexe` varchar(1) DEFAULT NULL,
  `numero_cnss` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees_collaborateur`
--

LOCK TABLES `employees_collaborateur` WRITE;
/*!40000 ALTER TABLE `employees_collaborateur` DISABLE KEYS */;
INSERT INTO `employees_collaborateur` VALUES (1,'100','2000-04-12','2026-05-09',NULL,''),(2,'101','2000-04-12','2026-05-09',NULL,''),(3,'102','2000-04-12','2026-05-09',NULL,'');
/*!40000 ALTER TABLE `employees_collaborateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquetes_accident`
--

DROP TABLE IF EXISTS `enquetes_accident`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enquetes_accident` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `telephone_victime` varchar(20) NOT NULL,
  `appartenance` varchar(150) NOT NULL,
  `horaire_travail` varchar(100) NOT NULL,
  `circonstances` longtext NOT NULL,
  `lieu_transport` varchar(200) NOT NULL,
  `temoins` json NOT NULL,
  `date_redaction` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `accident_id` bigint NOT NULL,
  `redige_par_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accident_id` (`accident_id`),
  KEY `enquetes_accident_redige_par_id_74451f53_fk_auth_user_id` (`redige_par_id`),
  CONSTRAINT `enquetes_accident_accident_id_cdad442f_fk_act_infir` FOREIGN KEY (`accident_id`) REFERENCES `act_infirmier_accidenttravail` (`id`),
  CONSTRAINT `enquetes_accident_redige_par_id_74451f53_fk_auth_user_id` FOREIGN KEY (`redige_par_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquetes_accident`
--

LOCK TABLES `enquetes_accident` WRITE;
/*!40000 ALTER TABLE `enquetes_accident` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquetes_accident` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiches_aptitude`
--

DROP TABLE IF EXISTS `fiches_aptitude`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiches_aptitude` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_visite` date NOT NULL,
  `type_visite` varchar(30) NOT NULL,
  `aptitude` varchar(30) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `medecin_travail_id` bigint NOT NULL,
  `nature_activite` varchar(255) NOT NULL,
  `precision_aptitude` longtext NOT NULL,
  `qualifications` longtext NOT NULL,
  `raison_sociale` varchar(255) NOT NULL,
  `adresse_entreprise` varchar(255) NOT NULL,
  `numero_cnss_entreprise` varchar(50) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `numero_cnss` varchar(50) NOT NULL,
  `ligne_visite_periodique_id` bigint DEFAULT NULL,
  `site_id` bigint DEFAULT NULL,
  `duree_aptitude` varchar(255) NOT NULL,
  `periode_temporaire` varchar(255) NOT NULL,
  `date_reprise` varchar(255) DEFAULT NULL,
  `date_prochaine_visite` date DEFAULT NULL,
  `validite_mois` int NOT NULL,
  `envoyee_rh` tinyint(1) NOT NULL,
  `date_envoi_rh` datetime(6) DEFAULT NULL,
  `observations_complementaires` longtext,
  `ligne_surveillance_speciale_id` bigint DEFAULT NULL,
  `examens_ulterieurs` json NOT NULL DEFAULT (_utf8mb4'[]'),
  PRIMARY KEY (`id`),
  KEY `fiches_aptitude_medecin_travail_id_52110e8e_fk_account_m` (`medecin_travail_id`),
  KEY `fiches_aptitude_collaborateur_id_8714bd06_fk_employees` (`collaborateur_id`),
  KEY `fiches_aptitude_ligne_visite_periodi_36dab2e9_fk_lignes_vi` (`ligne_visite_periodique_id`),
  KEY `fiches_aptitude_site_id_d3c3ccdd_fk_account_site_id` (`site_id`),
  KEY `fiches_aptitude_ligne_surveillance_s_9f974dc4_fk_lignes_su` (`ligne_surveillance_speciale_id`),
  CONSTRAINT `fiches_aptitude_collaborateur_id_8714bd06_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `fiches_aptitude_ligne_surveillance_s_9f974dc4_fk_lignes_su` FOREIGN KEY (`ligne_surveillance_speciale_id`) REFERENCES `lignes_surveillance_speciale` (`id`),
  CONSTRAINT `fiches_aptitude_ligne_visite_periodi_36dab2e9_fk_lignes_vi` FOREIGN KEY (`ligne_visite_periodique_id`) REFERENCES `lignes_visite_periodique` (`id`),
  CONSTRAINT `fiches_aptitude_medecin_travail_id_52110e8e_fk_account_m` FOREIGN KEY (`medecin_travail_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `fiches_aptitude_site_id_d3c3ccdd_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiches_aptitude`
--

LOCK TABLES `fiches_aptitude` WRITE;
/*!40000 ALTER TABLE `fiches_aptitude` DISABLE KEYS */;
INSERT INTO `fiches_aptitude` VALUES (1,'2025-06-09','EMBAUCHE','APTE_AU_POSTE','2025-06-09 22:26:17.065102',1,1,'Industrie automobile (câblage automobile)','apte','05h30','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Menzel Hayet','123456','100','12122',NULL,1,'','','',NULL,12,0,NULL,NULL,NULL,'[]'),(2,'2026-05-09','PERIODIQUE','APTE_AU_POSTE','2026-05-09 23:06:49.688896',1,1,'Industrie automobile (câblage automobile)','apte','qualifier','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Menzel Hayet','123456','100','',1,1,'','','','2027-05-09',12,0,NULL,'apte',NULL,'[]'),(3,'2025-05-09','EMBAUCHE','APTE_AU_POSTE','2025-05-09 23:13:04.607301',2,3,'Industrie automobile (câblage automobile)','appppppppppppte','qualifeir','LEONI Wiring Systems Tunisia SARL','Zone Industrielle, Massadine','123456','101','',NULL,2,'','','',NULL,12,0,NULL,NULL,NULL,'[]'),(4,'2025-05-09','EMBAUCHE','APTE_AU_POSTE','2025-05-09 23:24:12.929390',3,2,'Industrie automobile (câblage automobile)','apte','Qualifier','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Mateur','1232343','102','',NULL,3,'','','',NULL,12,0,NULL,NULL,NULL,'[{\"p\": false, \"r\": false, \"s\": true, \"medecin\": \"safa najjar\", \"conclusion\": \"TESTTT\", \"date_nature\": \"03/05/2026\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}]'),(5,'2026-05-09','PERIODIQUE','APTE_AU_POSTE','2026-05-09 23:30:15.166018',3,2,'Industrie automobile (câblage automobile)','','Qualifier','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Mateur','1232343','102','',2,3,'','','','2027-05-09',12,0,NULL,'{\"__sms_mateur_v1\":{\"version\":1,\"motifs\":{\"moins18\":true,\"enceinte_allaitante\":true,\"handicape\":false,\"travaux_risques_accidents\":false,\"maladie_chronique\":false,\"travaux_maladies_professionnelles\":false},\"poste_caracteristiques\":\"testt\",\"poste_ergonomie\":\"test\",\"tache_habituelle\":\"tes\",\"risques_accidents\":\"test\",\"tableaux_mp_et_agents\":\"ts\",\"evaluation_exposition\":\"testt\",\"surveillance_rows\":[{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"},{\"date_examen\":\"\",\"nature_examen\":\"\",\"resultats\":\"\",\"medecin_signature\":\"\"}],\"mesures_prevention\":\"\"}}',NULL,'[]'),(6,'2026-05-09','SPONTANEE','APTE_AU_POSTE','2026-05-09 23:30:54.746000',3,2,'Industrie automobile (câblage automobile)','TEST','Qualifier','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Mateur','1232343','','',NULL,3,'','','',NULL,12,0,NULL,NULL,NULL,'[{\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"test\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}, {\"p\": false, \"r\": false, \"s\": false, \"medecin\": \"\", \"conclusion\": \"\", \"date_nature\": \"\"}]'),(7,'2026-05-09','PERIODIQUE','APTE_AU_POSTE','2026-05-09 23:31:10.708933',3,2,'Industrie automobile (câblage automobile)','','Qualifier','LEONI WIRING SYSTEMS TUNISIA','Zone Industrielle, Mateur','1232343','102','',2,3,'','','','2027-05-09',12,0,NULL,'apte',NULL,'[]'),(8,'2026-05-09','PERIODIQUE','APTE_AU_POSTE','2026-05-09 23:35:46.994506',2,3,'Industrie automobile (câblage automobile)','apte','qualifeir','LEONI Wiring Systems Tunisia SARL','Zone Industrielle, Massadine','123456','101','',3,2,'1 an','','','2027-05-09',12,0,NULL,'qptee',NULL,'[]');
/*!40000 ALTER TABLE `fiches_aptitude` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiches_liaison`
--

DROP TABLE IF EXISTS `fiches_liaison`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiches_liaison` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_liaison` date NOT NULL,
  `nom_patient` varchar(255) NOT NULL,
  `age_patient` int DEFAULT NULL,
  `employeur` varchar(255) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `message` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `fiche_aptitude_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fiches_liaison_fiche_aptitude_id_1c065a6a_fk_fiches_aptitude_id` (`fiche_aptitude_id`),
  CONSTRAINT `fiches_liaison_fiche_aptitude_id_1c065a6a_fk_fiches_aptitude_id` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiches_liaison`
--

LOCK TABLES `fiches_liaison` WRITE;
/*!40000 ALTER TABLE `fiches_liaison` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiches_liaison` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiches_surveillance_speciale_mateur`
--

DROP TABLE IF EXISTS `fiches_surveillance_speciale_mateur`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiches_surveillance_speciale_mateur` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `motif_moins_18` tinyint(1) NOT NULL,
  `motif_enceinte_allaitante` tinyint(1) NOT NULL,
  `motif_handicape` tinyint(1) NOT NULL,
  `motif_travaux_risques_accidents` tinyint(1) NOT NULL,
  `motif_maladie_chronique` tinyint(1) NOT NULL,
  `motif_travaux_maladies_professionnelles` tinyint(1) NOT NULL,
  `poste_caracteristiques` longtext NOT NULL,
  `poste_ergonomie` longtext NOT NULL,
  `tache_habituelle` longtext NOT NULL,
  `risques_accidents` longtext NOT NULL,
  `tableaux_mp_et_agents` longtext NOT NULL,
  `evaluation_exposition` longtext NOT NULL,
  `surveillance_rows` json NOT NULL,
  `mesures_prevention` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `fiche_aptitude_id` bigint NOT NULL,
  `medecin_travail_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiche_aptitude_id` (`fiche_aptitude_id`),
  KEY `fiches_surveillance__collaborateur_id_b5c364ee_fk_employees` (`collaborateur_id`),
  KEY `fiches_surveillance__medecin_travail_id_9b6119aa_fk_account_m` (`medecin_travail_id`),
  CONSTRAINT `fiches_surveillance__collaborateur_id_b5c364ee_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `fiches_surveillance__fiche_aptitude_id_8597461b_fk_fiches_ap` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`),
  CONSTRAINT `fiches_surveillance__medecin_travail_id_9b6119aa_fk_account_m` FOREIGN KEY (`medecin_travail_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiches_surveillance_speciale_mateur`
--

LOCK TABLES `fiches_surveillance_speciale_mateur` WRITE;
/*!40000 ALTER TABLE `fiches_surveillance_speciale_mateur` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiches_surveillance_speciale_mateur` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hsee_equipementmedicalendommage`
--

DROP TABLE IF EXISTS `hsee_equipementmedicalendommage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hsee_equipementmedicalendommage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_constat` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `hsee_equipementmedic_site_id_7ccc8dc5_fk_account_s` (`site_id`),
  CONSTRAINT `hsee_equipementmedic_site_id_7ccc8dc5_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hsee_equipementmedicalendommage`
--

LOCK TABLES `hsee_equipementmedicalendommage` WRITE;
/*!40000 ALTER TABLE `hsee_equipementmedicalendommage` DISABLE KEYS */;
/*!40000 ALTER TABLE `hsee_equipementmedicalendommage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hsee_notificationhsse`
--

DROP TABLE IF EXISTS `hsee_notificationhsse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hsee_notificationhsse` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_creation` datetime(6) NOT NULL,
  `lu` tinyint(1) NOT NULL,
  `date_lecture` datetime(6) DEFAULT NULL,
  `accident_id` bigint NOT NULL,
  `enquete_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enquete_id` (`enquete_id`),
  KEY `hsee_notificationhss_accident_id_13dd7980_fk_act_infir` (`accident_id`),
  CONSTRAINT `hsee_notificationhss_accident_id_13dd7980_fk_act_infir` FOREIGN KEY (`accident_id`) REFERENCES `act_infirmier_accidenttravail` (`id`),
  CONSTRAINT `hsee_notificationhss_enquete_id_99a9dfd4_fk_enquetes_` FOREIGN KEY (`enquete_id`) REFERENCES `enquetes_accident` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hsee_notificationhsse`
--

LOCK TABLES `hsee_notificationhsse` WRITE;
/*!40000 ALTER TABLE `hsee_notificationhsse` DISABLE KEYS */;
/*!40000 ALTER TABLE `hsee_notificationhsse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hsee_parametrehseemensuel`
--

DROP TABLE IF EXISTS `hsee_parametrehseemensuel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hsee_parametrehseemensuel` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `annee` int unsigned NOT NULL,
  `mois` int unsigned NOT NULL,
  `heures_travaillees` bigint unsigned NOT NULL,
  `effectif_travailleurs` int unsigned DEFAULT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_parametre_hsee_annee_mois_site` (`annee`,`mois`,`site_id`),
  KEY `hsee_parametrehseemensuel_site_id_52985cb9_fk_account_site_id` (`site_id`),
  CONSTRAINT `hsee_parametrehseemensuel_site_id_52985cb9_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `hsee_parametrehseemensuel_chk_1` CHECK ((`annee` >= 0)),
  CONSTRAINT `hsee_parametrehseemensuel_chk_2` CHECK ((`mois` >= 0)),
  CONSTRAINT `hsee_parametrehseemensuel_chk_3` CHECK ((`heures_travaillees` >= 0)),
  CONSTRAINT `hsee_parametrehseemensuel_chk_4` CHECK ((`effectif_travailleurs` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hsee_parametrehseemensuel`
--

LOCK TABLES `hsee_parametrehseemensuel` WRITE;
/*!40000 ALTER TABLE `hsee_parametrehseemensuel` DISABLE KEYS */;
/*!40000 ALTER TABLE `hsee_parametrehseemensuel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lignes_contre_visites`
--

DROP TABLE IF EXISTS `lignes_contre_visites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lignes_contre_visites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ordre` int unsigned NOT NULL,
  `presence` varchar(20) NOT NULL,
  `raison_report` longtext NOT NULL,
  `verdict_saisi` tinyint(1) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `contre_visite_id` bigint DEFAULT NULL,
  `liste_id` bigint NOT NULL,
  `sms_jour_j_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ligne_cv_ordre_par_liste` (`liste_id`,`ordre`),
  UNIQUE KEY `contre_visite_id` (`contre_visite_id`),
  KEY `lignes_contre_visite_collaborateur_id_3d0fd967_fk_employees` (`collaborateur_id`),
  CONSTRAINT `lignes_contre_visite_collaborateur_id_3d0fd967_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `lignes_contre_visite_contre_visite_id_181e9636_fk_contre_vi` FOREIGN KEY (`contre_visite_id`) REFERENCES `contre_visites` (`id`),
  CONSTRAINT `lignes_contre_visite_liste_id_dbec93d4_fk_listes_co` FOREIGN KEY (`liste_id`) REFERENCES `listes_contre_visites` (`id`),
  CONSTRAINT `lignes_contre_visites_chk_1` CHECK ((`ordre` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lignes_contre_visites`
--

LOCK TABLES `lignes_contre_visites` WRITE;
/*!40000 ALTER TABLE `lignes_contre_visites` DISABLE KEYS */;
INSERT INTO `lignes_contre_visites` VALUES (1,1,'PRESENT','',0,1,NULL,1,1);
/*!40000 ALTER TABLE `lignes_contre_visites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lignes_surveillance_speciale`
--

DROP TABLE IF EXISTS `lignes_surveillance_speciale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lignes_surveillance_speciale` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ordre` int unsigned NOT NULL,
  `presence` varchar(20) NOT NULL,
  `raison_report` longtext NOT NULL,
  `traitement_termine` tinyint(1) NOT NULL,
  `remarque_medecin` longtext NOT NULL,
  `sms_jour_j_envoye` tinyint(1) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `liste_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ligne_ss_ordre_par_liste` (`liste_id`,`ordre`),
  UNIQUE KEY `uniq_ligne_ss_collaborateur_par_liste` (`liste_id`,`collaborateur_id`),
  KEY `lignes_surveillance__collaborateur_id_599e5a54_fk_employees` (`collaborateur_id`),
  CONSTRAINT `lignes_surveillance__collaborateur_id_599e5a54_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `lignes_surveillance__liste_id_ab7f5119_fk_listes_su` FOREIGN KEY (`liste_id`) REFERENCES `listes_surveillance_speciale` (`id`),
  CONSTRAINT `lignes_surveillance_speciale_chk_1` CHECK ((`ordre` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lignes_surveillance_speciale`
--

LOCK TABLES `lignes_surveillance_speciale` WRITE;
/*!40000 ALTER TABLE `lignes_surveillance_speciale` DISABLE KEYS */;
/*!40000 ALTER TABLE `lignes_surveillance_speciale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lignes_visite_periodique`
--

DROP TABLE IF EXISTS `lignes_visite_periodique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lignes_visite_periodique` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `presence` varchar(20) NOT NULL,
  `collaborateur_id` bigint NOT NULL,
  `fiche_aptitude_id` bigint DEFAULT NULL,
  `liste_id` bigint NOT NULL,
  `sms_jour_j_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_liste_vp_collaborateur` (`liste_id`,`collaborateur_id`),
  KEY `lignes_visite_period_collaborateur_id_6c570f2c_fk_employees` (`collaborateur_id`),
  KEY `lignes_visite_period_fiche_aptitude_id_6ea8d0ec_fk_fiches_ap` (`fiche_aptitude_id`),
  CONSTRAINT `lignes_visite_period_collaborateur_id_6c570f2c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `lignes_visite_period_fiche_aptitude_id_6ea8d0ec_fk_fiches_ap` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`),
  CONSTRAINT `lignes_visite_period_liste_id_fb5855fc_fk_listes_vi` FOREIGN KEY (`liste_id`) REFERENCES `listes_visite_periodique` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lignes_visite_periodique`
--

LOCK TABLES `lignes_visite_periodique` WRITE;
/*!40000 ALTER TABLE `lignes_visite_periodique` DISABLE KEYS */;
INSERT INTO `lignes_visite_periodique` VALUES (1,'PRESENT',1,2,1,1),(2,'PRESENT',3,7,2,1),(3,'PRESENT',2,8,3,1);
/*!40000 ALTER TABLE `lignes_visite_periodique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listes_contre_visites`
--

DROP TABLE IF EXISTS `listes_contre_visites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listes_contre_visites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(20) NOT NULL,
  `date_visite` date DEFAULT NULL,
  `statut` varchar(20) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `cree_par_id` bigint DEFAULT NULL,
  `medecin_controleur_id` bigint DEFAULT NULL,
  `site_id` bigint DEFAULT NULL,
  `sms_veille_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `listes_contre_visites_cree_par_id_5a7fc4d7_fk_account_profile_id` (`cree_par_id`),
  KEY `listes_contre_visite_medecin_controleur_i_d078d9a7_fk_account_m` (`medecin_controleur_id`),
  KEY `listes_contre_visites_site_id_476473b2_fk_account_site_id` (`site_id`),
  CONSTRAINT `listes_contre_visite_medecin_controleur_i_d078d9a7_fk_account_m` FOREIGN KEY (`medecin_controleur_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `listes_contre_visites_cree_par_id_5a7fc4d7_fk_account_profile_id` FOREIGN KEY (`cree_par_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `listes_contre_visites_site_id_476473b2_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listes_contre_visites`
--

LOCK TABLES `listes_contre_visites` WRITE;
/*!40000 ALTER TABLE `listes_contre_visites` DISABLE KEYS */;
INSERT INTO `listes_contre_visites` VALUES (1,'CV-2026-001','2026-05-18','EN_TRAITEMENT','2026-05-18 21:00:53.939443','2026-05-18 21:04:05.692098',3,5,1,0);
/*!40000 ALTER TABLE `listes_contre_visites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listes_surveillance_speciale`
--

DROP TABLE IF EXISTS `listes_surveillance_speciale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listes_surveillance_speciale` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(20) NOT NULL,
  `date_visite` date DEFAULT NULL,
  `statut` varchar(20) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `sms_veille_envoye` tinyint(1) NOT NULL,
  `cree_par_id` bigint DEFAULT NULL,
  `medecin_id` bigint DEFAULT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `listes_surveillance__cree_par_id_14919a29_fk_account_p` (`cree_par_id`),
  KEY `listes_surveillance__medecin_id_4e9d014e_fk_account_m` (`medecin_id`),
  KEY `listes_surveillance_speciale_site_id_a5684cf7_fk_account_site_id` (`site_id`),
  CONSTRAINT `listes_surveillance__cree_par_id_14919a29_fk_account_p` FOREIGN KEY (`cree_par_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `listes_surveillance__medecin_id_4e9d014e_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`),
  CONSTRAINT `listes_surveillance_speciale_site_id_a5684cf7_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listes_surveillance_speciale`
--

LOCK TABLES `listes_surveillance_speciale` WRITE;
/*!40000 ALTER TABLE `listes_surveillance_speciale` DISABLE KEYS */;
/*!40000 ALTER TABLE `listes_surveillance_speciale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `listes_visite_periodique`
--

DROP TABLE IF EXISTS `listes_visite_periodique`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `listes_visite_periodique` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `reference` varchar(20) NOT NULL,
  `date_visite` date DEFAULT NULL,
  `statut` varchar(20) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  `cree_par_id` bigint DEFAULT NULL,
  `medecin_id` bigint DEFAULT NULL,
  `sms_veille_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `listes_visite_period_cree_par_id_84f86748_fk_account_p` (`cree_par_id`),
  KEY `listes_visite_period_medecin_id_b6c59f5b_fk_account_m` (`medecin_id`),
  CONSTRAINT `listes_visite_period_cree_par_id_84f86748_fk_account_p` FOREIGN KEY (`cree_par_id`) REFERENCES `account_profile` (`id`),
  CONSTRAINT `listes_visite_period_medecin_id_b6c59f5b_fk_account_m` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `listes_visite_periodique`
--

LOCK TABLES `listes_visite_periodique` WRITE;
/*!40000 ALTER TABLE `listes_visite_periodique` DISABLE KEYS */;
INSERT INTO `listes_visite_periodique` VALUES (1,'VP-2026-001','2026-05-09','CLOTUREE','2026-05-09 23:06:10.947439','2026-05-09 23:07:23.452562',3,1,0),(2,'VP-2026-002','2026-05-09','CLOTUREE','2026-05-09 23:28:29.352779','2026-05-09 23:32:28.480117',10,2,0),(3,'VP-2026-003','2026-05-09','CLOTUREE','2026-05-09 23:34:30.617817','2026-05-09 23:36:32.645013',9,3,1);
/*!40000 ALTER TABLE `listes_visite_periodique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_records_dossiermedical`
--

DROP TABLE IF EXISTS `medical_records_dossiermedical`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records_dossiermedical` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `groupe_sanguin` varchar(3) DEFAULT NULL,
  `allergies` longtext,
  `date_creation` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `adresse` longtext,
  `antecedents_chirurgicaux` longtext,
  `antecedents_familiaux` longtext,
  `antecedents_gyneco` longtext,
  `antecedents_medicaux` longtext,
  `autres_vaccins` longtext,
  `date_modification` datetime(6) NOT NULL,
  `date_naissance` date DEFAULT NULL,
  `lieu_naissance` varchar(150) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `photo` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) NOT NULL,
  `vaccin_hepatite` date DEFAULT NULL,
  `vaccin_tetanos` date DEFAULT NULL,
  `vaccin_tuberculose` date DEFAULT NULL,
  `alcool` tinyint(1) NOT NULL,
  `automedication` tinyint(1) NOT NULL,
  `tabac` tinyint(1) NOT NULL,
  `matricule_ref` varchar(50) DEFAULT NULL,
  `site_id` bigint DEFAULT NULL,
  `antecedents_accidents_travail` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `antecedents_maladies_professionnelles` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `code_postal` varchar(20) NOT NULL,
  `entreprise_raison_sociale` varchar(255) NOT NULL,
  `examen_medical_initial` json NOT NULL DEFAULT (_utf8mb4'{}'),
  `examens_ulterieurs_triplet` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `habitude_alcool_precision` longtext,
  `habitude_automedication_precision` longtext,
  `habitude_tabac_precision` longtext,
  `historique_professionnel` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `niveau_etudes_diplomes` longtext NOT NULL,
  `numero_cnss_travailleur` varchar(80) NOT NULL,
  `numero_dossier_form` varchar(80) NOT NULL,
  `poste_travail_actuel` varchar(255) NOT NULL,
  `postes_risques_professionnels` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `profession_actuelle` varchar(255) NOT NULL,
  `date_recrutement` date DEFAULT NULL,
  `vaccinations_detail` json NOT NULL DEFAULT (_utf8mb4'[]'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `medical_records_dossiermedical_collaborateur_id_d1b1949c_uniq` (`collaborateur_id`),
  KEY `medical_records_doss_site_id_4b2b5694_fk_account_s` (`site_id`),
  CONSTRAINT `medical_records_doss_collaborateur_id_d1b1949c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `medical_records_doss_site_id_4b2b5694_fk_account_s` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_records_dossiermedical`
--

LOCK TABLES `medical_records_dossiermedical` WRITE;
/*!40000 ALTER TABLE `medical_records_dossiermedical` DISABLE KEYS */;
INSERT INTO `medical_records_dossiermedical` VALUES (1,NULL,NULL,'2026-05-09 22:22:26.745478',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 22:22:26.745478',NULL,NULL,'safa','','najjar',NULL,NULL,NULL,0,0,0,'100',1,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(2,NULL,NULL,'2026-05-09 23:02:15.037667',1,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 23:02:15.037667',NULL,NULL,'—','','—',NULL,NULL,NULL,0,0,0,'100',NULL,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(3,NULL,NULL,'2026-05-09 23:12:53.447599',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 23:12:53.447599',NULL,NULL,'wiem','','hamila',NULL,NULL,NULL,0,0,0,'101',2,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(4,NULL,NULL,'2026-05-09 23:13:55.305000',2,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 23:13:55.306011',NULL,NULL,'—','','—',NULL,NULL,NULL,0,0,0,'101',NULL,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(5,NULL,NULL,'2026-05-09 23:23:24.946793',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 23:23:24.946793',NULL,NULL,'Ali','','najjar',NULL,NULL,NULL,0,0,0,'102',3,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(6,NULL,NULL,'2026-05-09 23:25:17.793060',3,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-09 23:25:17.793060',NULL,NULL,'—','','—',NULL,NULL,NULL,0,0,0,'102',NULL,'[]','[]','','','{}','[]',NULL,NULL,NULL,'[]','','','','','[]','',NULL,'[]'),(7,NULL,'TESTTT','2026-05-13 11:21:14.055466',NULL,'swisse sousse','TESTTT','TESTTT','TESTTT','TESTTT','','2026-05-19 14:10:35.400107','2002-10-30','SOUSSE','yassmine','','mhadhbi',NULL,NULL,'2024-10-01',0,1,0,'103',1,'[{\"cause\": \"TESTTT\", \"duree_arret\": \"TESTTT\", \"siege_lesion\": \"TESTTT\", \"date_accident\": \"2026-01-01\", \"nature_lesion\": \"TESTTT\"}]','[{\"duree_arret\": \"TESTTT\", \"nom_maladie\": \"TESTTT\", \"agent_causal\": \"TESTTT\", \"date_decouverte\": \"2020-01-01\", \"numero_table_mp\": \"TESTTT\"}]','4000','LEONI','{\"poids\": \"63\", \"pouls\": \"TESTTT\", \"taille\": \"161\", \"abdomen\": \"TESTTT\", \"denture\": \"TESTTT\", \"teguments\": \"TESTTT\", \"date_examen\": \"2026-05-14\", \"medecin_nom\": \"faten najjar\", \"conclusion_type\": \"apte_poste\", \"systeme_nerveux\": \"TESTTT\", \"glandes_endocrines\": \"TESTTT\", \"tension_arterielle\": \"TESTTT\", \"appareil_locomoteur\": \"TESTTTttttttttttttttttttttttttttttetstettsttetsttesttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt\", \"appareil_respiratoire\": \"TESTTT\", \"vision_oeil_droit_loin\": \"TESTTTA\", \"vision_oeil_droit_pres\": \"TESTTT\", \"audition_oreille_droite\": \"TESTTT\", \"audition_oreille_gauche\": \"TESTTT\", \"examens_complementaires\": \"TESTTT\", \"resultat_examen_medical\": \"TESTTT\", \"vision_oeil_gauche_loin\": \"TESTTT\", \"vision_oeil_gauche_pres\": \"TESTTT\", \"appareil_genito_urinaire\": \"TESTTT\", \"conclusion_inapte_mesures\": \"\", \"appareil_cardio_vasculaire\": \"TESTTT\", \"conclusion_apte_poste_precision\": \"apte avec sucées  oui\", \"conclusion_sous_condition_precision\": \"\"}','[{\"reprise\": false, \"spontane\": false, \"periodique\": true, \"date_examen\": \"2026-07-01\", \"observations\": \"testtttetstt\"}, {\"reprise\": true, \"spontane\": true, \"periodique\": true, \"date_examen\": \"2026-02-01\", \"observations\": \"TESTTT\"}, {\"reprise\": true, \"spontane\": true, \"periodique\": true, \"date_examen\": \"2026-02-01\", \"observations\": \"TETSTSTSTS\"}]','','','','[{\"periode_au\": \"2020-02-10\", \"periode_du\": \"2020-10-01\", \"profession_poste\": \"TESTTT\", \"entreprise_adresse\": \"TESTTT\"}, {\"periode_au\": \"2026-01-01\", \"periode_du\": \"2026-01-01\", \"profession_poste\": \"TESTTT\", \"entreprise_adresse\": \"TESTTT\"}, {\"periode_au\": \"\", \"periode_du\": \"\", \"profession_poste\": \"\", \"entreprise_adresse\": \"\"}]','TESTTT','12232','1','TESTTT','[{\"periode_au\": \"2026-02-01\", \"periode_du\": \"2026-10-01\", \"nature_risque\": \"TESTTT\", \"description_poste\": \"TESTTT\"}]','TESTTT','2026-02-10','[{\"key\": \"tuberculose\", \"inj1\": \"2024-10-01\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"La tuberculose\", \"rappel\": \"\"}, {\"key\": \"tetanos\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"Le tétanos\", \"rappel\": \"\"}, {\"key\": \"hepatite\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"L\'hépatite virale\", \"rappel\": \"\"}, {\"key\": \"autres\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"D\'autres maladies\", \"rappel\": \"\"}]'),(8,NULL,'TESTTTTTTTTTT','2026-05-19 14:22:05.278905',NULL,'sousse','TESTTTTTTTTTT','TESTTTTTTTTTT','TESTTTTTTTTTT','TESTTTTTTTTTT','','2026-05-19 14:43:02.834995','2002-10-30','SOUSSE','youssef','','ben jomaa',NULL,NULL,'2020-01-01',0,1,0,'104',3,'[{\"cause\": \"TEST\", \"duree_arret\": \"TEST\", \"siege_lesion\": \"TEST\", \"date_accident\": \"2026-02-02\", \"nature_lesion\": \"TEST\"}]','[{\"duree_arret\": \"NON\", \"nom_maladie\": \"TEST\", \"agent_causal\": \"TEST\", \"date_decouverte\": \"2026-02-02\", \"numero_table_mp\": \"TEST\"}]','4000','LEONI','{\"poids\": \"80\", \"pouls\": \"TEST\", \"taille\": \"190\", \"abdomen\": \"TEST\", \"denture\": \"BIEN\", \"teguments\": \"BIEN\", \"date_examen\": \"2020-01-01\", \"medecin_nom\": \"yassine ben jomaa \", \"conclusion_type\": \"apte_sous_condition\", \"systeme_nerveux\": \"TEST\", \"glandes_endocrines\": \"TEST\", \"tension_arterielle\": \"TEST\", \"appareil_locomoteur\": \"BIEN \", \"appareil_respiratoire\": \"BIEN\", \"vision_oeil_droit_loin\": \"BIEN\", \"vision_oeil_droit_pres\": \"BIEN\", \"audition_oreille_droite\": \"BIEN\", \"audition_oreille_gauche\": \"BIEN\", \"examens_complementaires\": \"TEST\", \"resultat_examen_medical\": \"TEST\", \"vision_oeil_gauche_loin\": \"BIEN\", \"vision_oeil_gauche_pres\": \"BIEN\", \"appareil_genito_urinaire\": \"TEST\", \"conclusion_inapte_mesures\": \"\", \"appareil_cardio_vasculaire\": \"TEST\", \"conclusion_apte_poste_precision\": \"\", \"conclusion_sous_condition_precision\": \"TRAVAILL EN ASSISE\"}','[{\"reprise\": true, \"spontane\": true, \"periodique\": true, \"date_examen\": \"2020-02-02\", \"observations\": \"\"}, {\"reprise\": false, \"spontane\": false, \"periodique\": false, \"date_examen\": \"\", \"observations\": \"\"}, {\"reprise\": false, \"spontane\": false, \"periodique\": false, \"date_examen\": \"\", \"observations\": \"\"}]','','','','[{\"periode_au\": \"2026-01-01\", \"periode_du\": \"2020-01-01\", \"profession_poste\": \"PROO\", \"entreprise_adresse\": \"proo\"}, {\"periode_au\": \"\", \"periode_du\": \"\", \"profession_poste\": \"\", \"entreprise_adresse\": \"\"}, {\"periode_au\": \"\", \"periode_du\": \"\", \"profession_poste\": \"\", \"entreprise_adresse\": \"\"}]','Qualifier','122323','10','4020','[{\"periode_au\": \"\", \"periode_du\": \"2020-02-01\", \"nature_risque\": \"TEST\", \"description_poste\": \"TEST\"}]','proooo','2026-06-01','[{\"key\": \"tuberculose\", \"inj1\": \"2020-01-01\", \"inj2\": \"2020-02-02\", \"inj3\": \"2020-02-20\", \"label\": \"La tuberculose\", \"rappel\": \"2020-02-02\"}, {\"key\": \"tetanos\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"Le tétanos\", \"rappel\": \"\"}, {\"key\": \"hepatite\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"L\'hépatite virale\", \"rappel\": \"\"}, {\"key\": \"autres\", \"inj1\": \"\", \"inj2\": \"\", \"inj3\": \"\", \"label\": \"D\'autres maladies\", \"rappel\": \"\"}]');
/*!40000 ALTER TABLE `medical_records_dossiermedical` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordonnances`
--

DROP TABLE IF EXISTS `ordonnances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordonnances` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_ordonnance` date NOT NULL,
  `prescription` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `fiche_aptitude_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ordonnances_fiche_aptitude_id_aca6dbf5_fk_fiches_aptitude_id` (`fiche_aptitude_id`),
  CONSTRAINT `ordonnances_fiche_aptitude_id_aca6dbf5_fk_fiches_aptitude_id` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordonnances`
--

LOCK TABLES `ordonnances` WRITE;
/*!40000 ALTER TABLE `ordonnances` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordonnances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planning_itempassage`
--

DROP TABLE IF EXISTS `planning_itempassage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planning_itempassage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ordre` int unsigned DEFAULT NULL,
  `motif` longtext,
  `statut` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `liste_id` bigint NOT NULL,
  `sms_envoye` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `planning_itempassage_liste_id_ee18e3c6_fk_planning_` (`liste_id`),
  KEY `planning_itempassage_collaborateur_id_c6b39c5c_fk_employees` (`collaborateur_id`),
  CONSTRAINT `planning_itempassage_collaborateur_id_c6b39c5c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `planning_itempassage_liste_id_ee18e3c6_fk_planning_` FOREIGN KEY (`liste_id`) REFERENCES `planning_listepassage` (`id`),
  CONSTRAINT `planning_itempassage_chk_1` CHECK ((`ordre` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planning_itempassage`
--

LOCK TABLES `planning_itempassage` WRITE;
/*!40000 ALTER TABLE `planning_itempassage` DISABLE KEYS */;
INSERT INTO `planning_itempassage` VALUES (1,1,NULL,'EN_ATTENTE','2026-05-18 14:40:08.184792',1,1,1);
/*!40000 ALTER TABLE `planning_itempassage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planning_listepassage`
--

DROP TABLE IF EXISTS `planning_listepassage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planning_listepassage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `session` varchar(20) NOT NULL,
  `type_liste` varchar(30) NOT NULL,
  `statut` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `medecin_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `planning_listepassage_date_session_medecin_id__9c70040d_uniq` (`date`,`session`,`medecin_id`,`type_liste`),
  KEY `planning_listepassage_medecin_id_dd278551_fk_account_medecin_id` (`medecin_id`),
  CONSTRAINT `planning_listepassage_medecin_id_dd278551_fk_account_medecin_id` FOREIGN KEY (`medecin_id`) REFERENCES `account_medecin` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planning_listepassage`
--

LOCK TABLES `planning_listepassage` WRITE;
/*!40000 ALTER TABLE `planning_listepassage` DISABLE KEYS */;
INSERT INTO `planning_listepassage` VALUES (1,'2026-05-18','MATIN','CONSULTATION','ACTIVE','2026-05-18 14:40:03.181916','2026-05-18 14:40:19.504513',4),(2,'2026-05-18','MIDI','CONSULTATION','EN_PREPARATION','2026-05-18 22:05:07.359203','2026-05-18 22:05:07.359705',4);
/*!40000 ALTER TABLE `planning_listepassage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `remarques_infirmier`
--

DROP TABLE IF EXISTS `remarques_infirmier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remarques_infirmier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fiche_aptitude_id` bigint NOT NULL,
  `infirmier_id` bigint DEFAULT NULL,
  `remarque` longtext NOT NULL,
  `reevaluation` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_modification` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiche_aptitude_id` (`fiche_aptitude_id`),
  KEY `remarques_infirmier_infirmier_id_90325d25_fk_account_profile_id` (`infirmier_id`),
  CONSTRAINT `remarques_infirmier_fiche_aptitude_id_8860d13b_fk_fiches_ap` FOREIGN KEY (`fiche_aptitude_id`) REFERENCES `fiches_aptitude` (`id`),
  CONSTRAINT `remarques_infirmier_infirmier_id_90325d25_fk_account_profile_id` FOREIGN KEY (`infirmier_id`) REFERENCES `account_profile` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `remarques_infirmier`
--

LOCK TABLES `remarques_infirmier` WRITE;
/*!40000 ALTER TABLE `remarques_infirmier` DISABLE KEYS */;
/*!40000 ALTER TABLE `remarques_infirmier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_acteinfirmier`
--

DROP TABLE IF EXISTS `stock_acteinfirmier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_acteinfirmier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantite` int unsigned NOT NULL,
  `motif` longtext,
  `date_acte` datetime(6) NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  `infirmiere_id` int NOT NULL,
  `ligne_ordonnance_id` bigint DEFAULT NULL,
  `medicament_id` bigint NOT NULL,
  `type_acte` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_acteinfirmier_infirmiere_id_18738795_fk_auth_user_id` (`infirmiere_id`),
  KEY `stock_acteinfirmier_ligne_ordonnance_id_0db23ab1_fk_consultat` (`ligne_ordonnance_id`),
  KEY `stock_acteinfirmier_medicament_id_d0819e74_fk_stock_med` (`medicament_id`),
  KEY `stock_acteinfirmier_collaborateur_id_fdc5164c_fk_employees` (`collaborateur_id`),
  CONSTRAINT `stock_acteinfirmier_collaborateur_id_fdc5164c_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `stock_acteinfirmier_infirmiere_id_18738795_fk_auth_user_id` FOREIGN KEY (`infirmiere_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `stock_acteinfirmier_ligne_ordonnance_id_0db23ab1_fk_consultat` FOREIGN KEY (`ligne_ordonnance_id`) REFERENCES `consultations_ligneordonnance` (`id`),
  CONSTRAINT `stock_acteinfirmier_medicament_id_d0819e74_fk_stock_med` FOREIGN KEY (`medicament_id`) REFERENCES `stock_medicament` (`id`),
  CONSTRAINT `stock_acteinfirmier_chk_1` CHECK ((`quantite` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_acteinfirmier`
--

LOCK TABLES `stock_acteinfirmier` WRITE;
/*!40000 ALTER TABLE `stock_acteinfirmier` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_acteinfirmier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_medicament`
--

DROP TABLE IF EXISTS `stock_medicament`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_medicament` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nom` varchar(120) NOT NULL,
  `dosage` varchar(120) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `unite` varchar(20) NOT NULL,
  `conditionnement` varchar(20) NOT NULL,
  `qte_par_conditionnement` int unsigned NOT NULL,
  `conditionnement_personnalise` varchar(60) NOT NULL,
  `unite_personnalise` varchar(60) NOT NULL,
  `site_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_medicament_site_id_5b223195_fk_account_site_id` (`site_id`),
  CONSTRAINT `stock_medicament_site_id_5b223195_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `stock_medicament_chk_1` CHECK ((`qte_par_conditionnement` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_medicament`
--

LOCK TABLES `stock_medicament` WRITE;
/*!40000 ALTER TABLE `stock_medicament` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_medicament` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_mouvementstock`
--

DROP TABLE IF EXISTS `stock_mouvementstock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_mouvementstock` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type_mouvement` varchar(10) NOT NULL,
  `quantite` int unsigned NOT NULL,
  `motif` longtext,
  `date_mouvement` datetime(6) NOT NULL,
  `acte_id` bigint DEFAULT NULL,
  `stock_id` bigint NOT NULL,
  `utilisateur_id` int NOT NULL,
  `collaborateur_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_mouvementstock_acte_id_f27f1247_fk_stock_acteinfirmier_id` (`acte_id`),
  KEY `stock_mouvementstock_stock_id_88f5bcb0_fk_stock_sto` (`stock_id`),
  KEY `stock_mouvementstock_utilisateur_id_9341f960_fk_auth_user_id` (`utilisateur_id`),
  KEY `stock_mouvementstock_collaborateur_id_94535041_fk_employees` (`collaborateur_id`),
  CONSTRAINT `stock_mouvementstock_acte_id_f27f1247_fk_stock_acteinfirmier_id` FOREIGN KEY (`acte_id`) REFERENCES `stock_acteinfirmier` (`id`),
  CONSTRAINT `stock_mouvementstock_collaborateur_id_94535041_fk_employees` FOREIGN KEY (`collaborateur_id`) REFERENCES `employees_collaborateur` (`id`),
  CONSTRAINT `stock_mouvementstock_stock_id_88f5bcb0_fk_stock_sto` FOREIGN KEY (`stock_id`) REFERENCES `stock_stockmedicament` (`id`),
  CONSTRAINT `stock_mouvementstock_utilisateur_id_9341f960_fk_auth_user_id` FOREIGN KEY (`utilisateur_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `stock_mouvementstock_chk_1` CHECK ((`quantite` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_mouvementstock`
--

LOCK TABLES `stock_mouvementstock` WRITE;
/*!40000 ALTER TABLE `stock_mouvementstock` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_mouvementstock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_stockmedicament`
--

DROP TABLE IF EXISTS `stock_stockmedicament`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_stockmedicament` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantite` int unsigned NOT NULL,
  `seuil_alerte` int unsigned NOT NULL,
  `date_expiration` date DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `medicament_id` bigint NOT NULL,
  `site_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_stock_per_site_medicament` (`site_id`,`medicament_id`),
  KEY `stock_stockmedicament_medicament_id_55824e59` (`medicament_id`),
  CONSTRAINT `stock_stockmedicamen_medicament_id_55824e59_fk_stock_med` FOREIGN KEY (`medicament_id`) REFERENCES `stock_medicament` (`id`),
  CONSTRAINT `stock_stockmedicament_site_id_0203d085_fk_account_site_id` FOREIGN KEY (`site_id`) REFERENCES `account_site` (`id`),
  CONSTRAINT `stock_stockmedicament_chk_1` CHECK ((`quantite` >= 0)),
  CONSTRAINT `stock_stockmedicament_chk_2` CHECK ((`seuil_alerte` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_stockmedicament`
--

LOCK TABLES `stock_stockmedicament` WRITE;
/*!40000 ALTER TABLE `stock_stockmedicament` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_stockmedicament` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_blacklistedtoken`
--

DROP TABLE IF EXISTS `token_blacklist_blacklistedtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_blacklistedtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blacklisted_at` datetime(6) NOT NULL,
  `token_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_id` (`token_id`),
  CONSTRAINT `token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk` FOREIGN KEY (`token_id`) REFERENCES `token_blacklist_outstandingtoken` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_blacklistedtoken`
--

LOCK TABLES `token_blacklist_blacklistedtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_blacklistedtoken` VALUES (1,'2026-05-10 12:31:06.641009',20),(2,'2026-05-11 01:30:51.239262',24),(3,'2026-05-13 13:18:10.640128',27),(4,'2026-05-13 13:20:56.479789',28),(5,'2026-05-13 13:29:13.365259',26),(6,'2026-05-13 18:08:58.570948',29),(7,'2026-05-13 18:28:28.672204',31),(8,'2026-05-13 22:48:38.481070',33),(9,'2026-05-13 22:56:47.783517',30),(10,'2026-05-14 00:57:17.135358',36),(11,'2026-05-14 01:18:01.035641',37),(12,'2026-05-14 01:31:49.102256',32),(13,'2026-05-14 10:18:53.744635',38),(14,'2026-05-14 12:19:53.554621',42),(15,'2026-05-14 19:03:56.737071',43),(16,'2026-05-14 19:04:21.512500',39),(17,'2026-05-16 02:01:19.392001',44),(18,'2026-05-16 11:33:47.203033',47),(19,'2026-05-16 16:24:52.783566',49),(20,'2026-05-16 20:13:17.528754',50),(21,'2026-05-16 22:16:48.836607',52),(22,'2026-05-18 10:50:52.162785',53),(23,'2026-05-18 12:51:12.703706',54),(24,'2026-05-18 14:51:42.674525',55),(25,'2026-05-18 20:24:21.960456',56),(26,'2026-05-18 22:24:35.180581',57),(27,'2026-05-18 23:02:35.120844',61),(28,'2026-05-19 14:10:01.060236',148),(29,'2026-05-19 14:19:05.172345',201),(30,'2026-05-19 14:21:16.867206',200),(31,'2026-05-19 18:17:43.010296',212),(32,'2026-05-19 18:17:43.889224',208),(33,'2026-05-19 20:18:29.645456',214);
/*!40000 ALTER TABLE `token_blacklist_blacklistedtoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `token_blacklist_outstandingtoken`
--

DROP TABLE IF EXISTS `token_blacklist_outstandingtoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `token_blacklist_outstandingtoken` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` longtext NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) NOT NULL,
  `user_id` int DEFAULT NULL,
  `jti` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq` (`jti`),
  KEY `token_blacklist_outs_user_id_83bc629a_fk_auth_user` (`user_id`),
  CONSTRAINT `token_blacklist_outs_user_id_83bc629a_fk_auth_user` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `token_blacklist_outstandingtoken`
--

LOCK TABLES `token_blacklist_outstandingtoken` WRITE;
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` DISABLE KEYS */;
INSERT INTO `token_blacklist_outstandingtoken` VALUES (1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk2OTYxMiwiaWF0IjoxNzc4MzY0ODEyLCJqdGkiOiI2NDlkODQ2MTAwOTc0ZDY1YmQyMDI4YzY0MzBkN2Y3ZCIsInVzZXJfaWQiOiIzIn0.Y8tYCGnGhuhD8C_D5ncQNDU0rM5nSg4Jt8H2Kty9bEg','2026-05-09 22:13:32.744234','2026-05-16 22:13:32.000000',3,'649d846100974d65bd2028c6430d7f7d'),(2,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk2OTYyNSwiaWF0IjoxNzc4MzY0ODI1LCJqdGkiOiI3MmI2N2FjNDZiYzE0ZDc5OGRlZThkZjdjZGRlOTc5YyIsInVzZXJfaWQiOiIzIn0.7_9lbuE6vJDWIXz99gplBY-Nu_NCSTMdm1fBFOtP1Yc','2026-05-09 22:13:45.966068','2026-05-16 22:13:45.000000',3,'72b67ac46bc14d798dee8df7cdde979c'),(3,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MDAxNywiaWF0IjoxNzc4MzY1MjE3LCJqdGkiOiI1NWE4OTBmMjdiNWQ0NGJhYWUyMmMwMDJlYjMzM2ZmNSIsInVzZXJfaWQiOiIyIn0.I0H3OXXUb5aST_Ut-YpjNthBCZOagWkvykY6EEwvNBQ','2026-05-09 22:20:17.264367','2026-05-16 22:20:17.000000',2,'55a890f27b5d44baae22c002eb333ff5'),(4,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MDAyOSwiaWF0IjoxNzc4MzY1MjI5LCJqdGkiOiI0ZTAzNWMzNTU4ZDE0MWE1YjRhNGU3ZGViZWQ2YjUzMyIsInVzZXJfaWQiOiIyIn0.y2IhQHHTYZdoGrxxiNkJizwHsspAr5OahLEeXnWMPVg','2026-05-09 22:20:29.791248','2026-05-16 22:20:29.000000',2,'4e035c3558d141a5b4a4e7debed6b533'),(5,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MDA2OCwiaWF0IjoxNzc4MzY1MjY4LCJqdGkiOiI5M2M3NDBmOTc4MDM0NjUxODlkNmE2NzQ2Y2UxMGE0YyIsInVzZXJfaWQiOiI2In0.CZYOBx6K87ld5FdWbQmMAy0-SDfAw3_I5Q3u8dsfF28','2026-05-09 22:21:08.269827','2026-05-16 22:21:08.000000',6,'93c740f97803465189d6a6746ce10a4c'),(6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MDA4MSwiaWF0IjoxNzc4MzY1MjgxLCJqdGkiOiJmYjJlYTBjYzJjY2Y0OTRmYmI0ZjAxMzdlNzgxOWQzZCIsInVzZXJfaWQiOiI2In0.nNUAztQryMamLBfJdGVUC6DQDHBNK1p8nnz3jaLofKM','2026-05-09 22:21:21.442238','2026-05-16 22:21:21.000000',6,'fb2ea0cc2ccf494fbb4f0137e7819d3d'),(7,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3Mjk1MCwiaWF0IjoxNzc4MzY4MTUwLCJqdGkiOiI4YThhYWIzNWZhZjU0NjExYTBmZTc1YTJjZTZiYmViZiIsInVzZXJfaWQiOiI5In0.7VeSxzkt-EKKmFkbpHprLcKhv70m3cjYZNrF3duGGHo','2026-05-09 23:09:10.249634','2026-05-16 23:09:10.000000',9,'8a8aab35faf54611a0fe75a2ce6bbebf'),(8,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3Mjk2NSwiaWF0IjoxNzc4MzY4MTY1LCJqdGkiOiJjNTg1MTU0MWVkMmQ0NTFjODYxNDBjMjM4YjNmOWUyZSIsInVzZXJfaWQiOiI5In0.QfvxYQTQyaF7ExSpQz28y9Kk2lgSbfXKSRgKJyoDAKI','2026-05-09 23:09:25.090356','2026-05-16 23:09:25.000000',9,'c5851541ed2d451c86140c238b3f9e2e'),(9,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzA1NCwiaWF0IjoxNzc4MzY4MjU0LCJqdGkiOiIwNjE1MGUwYmY3ZmM0NzA0OTFkMjhmYzZhOGFlMDE0YyIsInVzZXJfaWQiOiI3In0.GecRD6WPqfDHDKPT35t9O99Fy-VSyRoTljDmrVoC4pQ','2026-05-09 23:10:54.903897','2026-05-16 23:10:54.000000',7,'06150e0bf7fc470491d28fc6a8ae014c'),(10,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzA3MSwiaWF0IjoxNzc4MzY4MjcxLCJqdGkiOiI0YWE4MTE3Y2RlOWQ0ZmI0ODQ5YWI3ZGY0NzA2NTNjOSIsInVzZXJfaWQiOiI3In0.KfMYVH0zz-ALEgDG7w19WfA_Xoz5z0ayqWbgAKIsfKU','2026-05-09 23:11:11.184417','2026-05-16 23:11:11.000000',7,'4aa8117cde9d4fb4849ab7df470653c9'),(11,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzExMiwiaWF0IjoxNzc4MzY4MzEyLCJqdGkiOiIwZWRmMmMwOGM2NWY0MDg0YThkNGE5NzNjMGMzNDc1NCIsInVzZXJfaWQiOiI0In0._x1XWdEKZFm2q5X_NkS7utfkdIJ7d3Zfc7vXxTEXAdw','2026-05-09 23:11:52.457193','2026-05-16 23:11:52.000000',4,'0edf2c08c65f4084a8d4a973c0c34754'),(12,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzEyNiwiaWF0IjoxNzc4MzY4MzI2LCJqdGkiOiI1MGI5MDI2N2UxN2M0YTllOTg2ZTI4ZDIwYmQxYjU2MyIsInVzZXJfaWQiOiI0In0.dhgrJLNsjaexYop3WDZb2FZpUsoJ2ZSG1PE1WwoBHg8','2026-05-09 23:12:06.148996','2026-05-16 23:12:06.000000',4,'50b90267e17c4a9e986e28d20bd1b563'),(13,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzU0NCwiaWF0IjoxNzc4MzY4NzQ0LCJqdGkiOiJkOTRkMDA5NjBlMTE0MWE0OGU1NTI0Y2MwNGU5ZDQxZiIsInVzZXJfaWQiOiIxMCJ9.UKekgLuxwcsedtOjQl5hOgz8KERTMdv-z7Nitye_GCc','2026-05-09 23:19:04.302471','2026-05-16 23:19:04.000000',10,'d94d00960e1141a48e5524cc04e9d41f'),(14,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzU1NywiaWF0IjoxNzc4MzY4NzU3LCJqdGkiOiIwYjFmMGFlYmQ4MDI0MDZmOGU5YjM3MWY1ZmRiMzk2ZCIsInVzZXJfaWQiOiIxMCJ9.r7sU1Bl2MNu8xuqOhLUJFj65b77Q0lQXMm_2lMf4Z-o','2026-05-09 23:19:17.948276','2026-05-16 23:19:17.000000',10,'0b1f0aebd802406f8e9b371f5fdb396d'),(15,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzcwMiwiaWF0IjoxNzc4MzY4OTAyLCJqdGkiOiIwZDc0YTc2MzE3NmE0MWIzOTM3NjdlZDQyNjI2ODQwOSIsInVzZXJfaWQiOiI4In0.amPqg7M9j4N2KwETW8FyThHAPD0ON0wpl9w_FeNvFVU','2026-05-09 23:21:42.616732','2026-05-16 23:21:42.000000',8,'0d74a763176a41b393767ed426268409'),(16,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3MzcxNiwiaWF0IjoxNzc4MzY4OTE2LCJqdGkiOiI3ZmJlOGQ0Y2EwZTE0N2Y0OGNmMzgzMGUwOGI4NDNjYSIsInVzZXJfaWQiOiI4In0.J1yEzMhZ3cP7HMlxU9763qjrmg_TM3BiP3LfeCN5EYo','2026-05-09 23:21:56.348636','2026-05-16 23:21:56.000000',8,'7fbe8d4ca0e147f48cf3830e08b843ca'),(17,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3Mzc1NSwiaWF0IjoxNzc4MzY4OTU1LCJqdGkiOiIyN2YyNzAxOGMyNjc0NWY2YjAwOGQ3NWM0Y2VkNjg3YyIsInVzZXJfaWQiOiI1In0.WQyov3PcAPRXYkRE4dY3t7Zs3KpLBx8CN1QnNSNbwSg','2026-05-09 23:22:35.613768','2026-05-16 23:22:35.000000',5,'27f27018c26745f6b008d75c4ced687c'),(18,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3Mzc2NiwiaWF0IjoxNzc4MzY4OTY2LCJqdGkiOiJmNzhmYjAwNDZjMTg0NjMxYTRkNmIzODQ0OGEyM2ZmNyIsInVzZXJfaWQiOiI1In0.q_cKup98DGhnVNQs4POITmxQglmnirx0hkEBhqnaFb0','2026-05-09 23:22:46.285662','2026-05-16 23:22:46.000000',5,'f78fb0046c184631a4d6b38448a23ff7'),(19,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3NDQ2NSwiaWF0IjoxNzc4MzY5NjY1LCJqdGkiOiIzMDk4YjllNTRhMTY0M2FhOWM1M2ZkZWQyNTIxMjkxMCIsInVzZXJfaWQiOiI5In0.yorTcIdrdhWqmlJTEuCaq4DyX3jP2yx_KRYMLAo7dAk','2026-05-09 23:34:25.673454','2026-05-16 23:34:25.000000',9,'3098b9e54a1643aa9c53fded25212910'),(20,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3NDQ5NSwiaWF0IjoxNzc4MzY5Njk1LCJqdGkiOiI4ZDM1OGIzNWM1Mjc0NGU3YjMwNDYxZjQxNjEzZmZmYSIsInVzZXJfaWQiOiI3In0.8W58z__PLgVxxL_kHh1kgsEmsllIbhVuU9i_X8NFQAA','2026-05-09 23:34:55.797910','2026-05-16 23:34:55.000000',7,'8d358b35c52744e7b30461f41613fffa'),(21,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3NDUzMywiaWF0IjoxNzc4MzY5NzMzLCJqdGkiOiJjNzExNzRhM2ZjMjU0MzJlYmY3OGVjNzI3YTQzNTk4YiIsInVzZXJfaWQiOiI0In0.TT5n1_8PjDtKIvWi4IewnnwPkA8c1oOBURl20giG7Cw','2026-05-09 23:35:33.689948','2026-05-16 23:35:33.000000',4,'c71174a3fc25432ebf78ec727a43598b'),(22,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODk3NDcwMSwiaWF0IjoxNzc4MzY5OTAxLCJqdGkiOiJjMDk0NGYxMzA0YWU0MzhkYmE5ODkxYWE0NWY5MjJhYyIsInVzZXJfaWQiOiI2In0.jKtK3d5r8ogKMSv206zoHZDGFiUaLPy-rp5ECtG1E2g','2026-05-09 23:38:21.697162','2026-05-16 23:38:21.000000',6,'c0944f1304ae438dba9891aa45f922ac'),(23,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTAyMTA2NiwiaWF0IjoxNzc4NDE2MjY2LCJqdGkiOiI3ZWJhMTc5YTA4ZWY0MmU3OWM0ZDdjODU0NjVkZWZlMiIsInVzZXJfaWQiOiI3Iiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoyLCJzaXRlX25vbSI6Ikxlb25pIE1hc3NhZGluZSIsInNpdGVfdGVtcGxhdGVfa2V5IjoiU09VU1NFIiwic2l0ZV9jb2RlIjoiTUFTU0FESU5FIiwidXNlcm5hbWUiOiJOYWlyYSBOYWpqYXIifQ.E5d942qXuR_o61yBsUYKntI6s3hUJqDGzu57fWsFYj8','2026-05-10 12:31:06.621148','2026-05-17 12:31:06.000000',7,'7eba179a08ef42e79c4d7c85465defe2'),(24,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTAyMTkxMiwiaWF0IjoxNzc4NDE3MTEyLCJqdGkiOiI2YTcwYWYzOTEzYTQ0YmFmYmI2MDEwZTE4M2Y1YTg2ZiIsInVzZXJfaWQiOiI1In0.tfPOmOiAtdkLhqCuLx0jd2Y5vE3w41sr5IZO7KugKX8','2026-05-10 12:45:12.968585','2026-05-17 12:45:12.000000',5,'6a70af3913a44bafbb6010e183f5a86f'),(25,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTA2Nzg1MSwiaWF0IjoxNzc4NDYzMDUxLCJqdGkiOiJjZmY4MWZlODIwYzE0ZjcxOTRmZDgxMmI5ODgwNWEwZSIsInVzZXJfaWQiOiI1Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjozLCJzaXRlX25vbSI6Ikxlb25pIE1hdGV1ciIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTUFURVVSIiwic2l0ZV9jb2RlIjoiTUFURVVSIiwidXNlcm5hbWUiOiJGYXRpaGEgS2lsYW5pIn0.5OKybRWyMdQhNl4ICA5gykVdRNG8aNkrxz7gFWP5p94','2026-05-11 01:30:51.212259','2026-05-18 01:30:51.000000',5,'cff81fe820c14f7194fd812b98805a0e'),(26,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI3NTc1MiwiaWF0IjoxNzc4NjcwOTUyLCJqdGkiOiJhZmNjYjY2ZWM0Mjk0YTgyODQwNTNjMzEwZTE2MThjNSIsInVzZXJfaWQiOiI2In0.-ugJWkFI5iFxYP6b4ITmEqlKx7zprNiVU4rHdQc1EoM','2026-05-13 11:15:52.606593','2026-05-20 11:15:52.000000',6,'afccb66ec4294a8284053c310e1618c5'),(27,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI3NTg2NSwiaWF0IjoxNzc4NjcxMDY1LCJqdGkiOiJhMWYwMmE2NmU4Yjg0M2Y0YTYzYTA3ZDQ0OWM2ZGJhMiIsInVzZXJfaWQiOiIzIn0.HSvkPSSsxfln6sr4yoIpABz4HoOzAkDUz_WLZAsL4KQ','2026-05-13 11:17:45.087443','2026-05-20 11:17:45.000000',3,'a1f02a66e8b843f4a63a07d449c6dba2'),(28,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI3NjA0NCwiaWF0IjoxNzc4NjcxMjQ0LCJqdGkiOiJhNWMzY2Q3Y2FjNjc0NjAyOWFhODBiNzkyZmJkNDc4OSIsInVzZXJfaWQiOiIyIn0.ZFK2T_nlNagnlvod26PH3t2rGZ4EamxEoKPWgTnbSd4','2026-05-13 11:20:44.688336','2026-05-20 11:20:44.000000',2,'a5c3cd7cac6746029aa80b792fbd4789'),(29,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI4MzA5MCwiaWF0IjoxNzc4Njc4MjkwLCJqdGkiOiI0OWM2MjA4MjlhMDU0OWQ2OTQxM2JmYjI4MjgyZjJjMiIsInVzZXJfaWQiOiIzIiwicm9sZSI6InJoIiwibXVzdF9jaGFuZ2VfcGFzc3dvcmQiOmZhbHNlLCJtZWRfdHlwZSI6bnVsbCwibm9tX2FyIjpudWxsLCJwcmVub21fYXIiOm51bGwsInNpdGVfaWQiOjEsInNpdGVfbm9tIjoiTGVvbmkgTWVuemVsIEhheWV0Iiwic2l0ZV90ZW1wbGF0ZV9rZXkiOiJNT05BU1RJUiIsInNpdGVfY29kZSI6Ik1FTlpFTF9IQVlFVCIsInVzZXJuYW1lIjoiQWxpIE5hamphciJ9.ncwYlUCJxRAUNnzI4KMqaC0F4gVA2lmReWFzctLUTwU','2026-05-13 13:18:10.570561','2026-05-20 13:18:10.000000',3,'49c620829a0549d69413bfb28282f2c2'),(30,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI4MzI1NiwiaWF0IjoxNzc4Njc4NDU2LCJqdGkiOiI5NGZjOTkwNWVkOWY0MmViYjBhNDYwZWYyOWVhNGRiZSIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.0s9EFdAcVvNP6vmjmlTyBvZrF46lPd6bRFa6_IBqebg','2026-05-13 13:20:56.475393','2026-05-20 13:20:56.000000',2,'94fc9905ed9f42ebb0a460ef29ea4dbe'),(31,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTI4Mzc1MywiaWF0IjoxNzc4Njc4OTUzLCJqdGkiOiI2ZGRjMzY1ZTIxNmM0NjMzOTc4ZTU3ZjFiMGNlZjRiNiIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9.epNMJTVyN8BG_QSuPa6MB8Mwt89HoVShh-g-FJQIDZA','2026-05-13 13:29:13.357904','2026-05-20 13:29:13.000000',6,'6ddc365e216c4633978e57f1b0cef4b6'),(32,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMwMDUzOCwiaWF0IjoxNzc4Njk1NzM4LCJqdGkiOiJhZWY4NTJlYmI4NTc0MTA3YWJkZmFiODQ1ZWNiOWQyNSIsInVzZXJfaWQiOiIzIiwicm9sZSI6InJoIiwibXVzdF9jaGFuZ2VfcGFzc3dvcmQiOmZhbHNlLCJtZWRfdHlwZSI6bnVsbCwibm9tX2FyIjpudWxsLCJwcmVub21fYXIiOm51bGwsInNpdGVfaWQiOjEsInNpdGVfbm9tIjoiTGVvbmkgTWVuemVsIEhheWV0Iiwic2l0ZV90ZW1wbGF0ZV9rZXkiOiJNT05BU1RJUiIsInNpdGVfY29kZSI6Ik1FTlpFTF9IQVlFVCIsInVzZXJuYW1lIjoiQWxpIE5hamphciJ9.tHZLbc3fjHuDI7Yi4PMk-Z9xYxUoRYvITXQIymVGhMc','2026-05-13 18:08:58.550948','2026-05-20 18:08:58.000000',3,'aef852ebb8574107abdfab845ecb9d25'),(33,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMwMTcwOCwiaWF0IjoxNzc4Njk2OTA4LCJqdGkiOiIxZjJmNzBlOWNlYTQ0OWMzODE2YjFkYTA5OTMxYzYyMyIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9.wdOXUldEgcUS5Gj4HbVioudtz-bm2uIWRYv6Wnc95E4','2026-05-13 18:28:28.613790','2026-05-20 18:28:28.000000',6,'1f2f70e9cea449c3816b1da09931c623'),(34,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMxNzMxOCwiaWF0IjoxNzc4NzEyNTE4LCJqdGkiOiIxOGQ1YzdlZmJmMGY0NWVjYmI2OTllOGRhZDI5ZGM0MiIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9._JCoudptRjxFAatM4SA_Pugq1YHfYLvX4ETxFBVeyeI','2026-05-13 22:48:38.442251','2026-05-20 22:48:38.000000',6,'18d5c7efbf0f45ecbb699e8dad29dc42'),(35,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMxNzgwNywiaWF0IjoxNzc4NzEzMDA3LCJqdGkiOiI0N2UyYjM3OWFkY2M0MjMxOGE1N2QyNjhjMWRiYmIxZCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.rlLRrcDdWB-949THiAyMMzCTn7ueHnI2lT7NeHMz3LA','2026-05-13 22:56:47.766449','2026-05-20 22:56:47.000000',2,'47e2b379adcc42318a57d268c1dbbb1d'),(36,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMxNzgxMywiaWF0IjoxNzc4NzEzMDEzLCJqdGkiOiI5NmIyN2JhNTY3ZDU0ODUzYWFlMzA2YzczNTQxZGExOCIsInVzZXJfaWQiOiIyIn0.98TtsXk-vzi2xESwcr98Y1iJGaDSC0OBwa88b-GrjT8','2026-05-13 22:56:53.976269','2026-05-20 22:56:53.000000',2,'96b27ba567d54853aae306c73541da18'),(37,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMxNzg5NCwiaWF0IjoxNzc4NzEzMDk0LCJqdGkiOiIzNDE5YTVhNWY4NTU0M2E1YTA3NDFmNGU2ZGEyYTNiYiIsInVzZXJfaWQiOiI2In0.gKFOjohaGfHlBbIvOZnsAK1hdyLyFBdjSlZAn51lvi4','2026-05-13 22:58:14.115189','2026-05-20 22:58:14.000000',6,'3419a5a5f85543a5a0741f4e6da2a3bb'),(38,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMyNTAzNywiaWF0IjoxNzc4NzIwMjM3LCJqdGkiOiJlZDhiZjUyYWEwYzc0NzZiODQ0ZTRhOGNiNzhjNjBjNyIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.swNXWY59Stb4HwrkzdKqAX2G-OK8M8U1RH8YgdRlz9s','2026-05-14 00:57:17.101169','2026-05-21 00:57:17.000000',2,'ed8bf52aa0c7476b844e4a8cb78c60c7'),(39,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMyNjI4MCwiaWF0IjoxNzc4NzIxNDgwLCJqdGkiOiI1OTZiNWUzOWEzZjE0ZjUyYTVlOTVhYmI5MjAxZTI4ZiIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9.NqG41LQ4e09YNrxeTg-bYv4qRzC9FIRGprRqgjfIyHc','2026-05-14 01:18:00.974916','2026-05-21 01:18:00.000000',6,'596b5e39a3f14f52a5e95abb9201e28f'),(40,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTMyNzEwOSwiaWF0IjoxNzc4NzIyMzA5LCJqdGkiOiJlMDZjYzAwZTk0ZjQ0NDhkOTY2MzJjNTdhOTljYWFhYyIsInVzZXJfaWQiOiIzIiwicm9sZSI6InJoIiwibXVzdF9jaGFuZ2VfcGFzc3dvcmQiOmZhbHNlLCJtZWRfdHlwZSI6bnVsbCwibm9tX2FyIjpudWxsLCJwcmVub21fYXIiOm51bGwsInNpdGVfaWQiOjEsInNpdGVfbm9tIjoiTGVvbmkgTWVuemVsIEhheWV0Iiwic2l0ZV90ZW1wbGF0ZV9rZXkiOiJNT05BU1RJUiIsInNpdGVfY29kZSI6Ik1FTlpFTF9IQVlFVCIsInVzZXJuYW1lIjoiQWxpIE5hamphciJ9.s00IudOgUzSxMC3hWlZghkiCNYH4cra-NIW6h-untPw','2026-05-14 01:31:49.086633','2026-05-21 01:31:49.000000',3,'e06cc00e94f4448d96632c57a99caaac'),(41,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTM1ODczMywiaWF0IjoxNzc4NzUzOTMzLCJqdGkiOiI5NTc4MTNhYjJjNmI0MGUxYjY1ZTAwODBjNTkzODMwOSIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.pxz8xFSIntIh4nm2LWcZTRCSzAcEZh_z80IjL52BZds','2026-05-14 10:18:53.681784','2026-05-21 10:18:53.000000',2,'957813ab2c6b40e1b65e0080c5938309'),(42,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTM1ODczOSwiaWF0IjoxNzc4NzUzOTM5LCJqdGkiOiJiYzQ2NTcyMjFhNmQ0ZTk5YTg1MmExMGEzOGQ5ZTVhNiIsInVzZXJfaWQiOiIyIn0.g1FnHTQj8AGKr9Un7qY4rKrZXoO8lbQnvEO808zYeXY','2026-05-14 10:18:59.792942','2026-05-21 10:18:59.000000',2,'bc4657221a6d4e99a852a10a38d9e5a6'),(43,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTM2NTk5MywiaWF0IjoxNzc4NzYxMTkzLCJqdGkiOiIzMjdlMzg3ODZhYWY0NDk2YTE5MTQyNTNkZWYxZTE5ZCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.34X4P9Qmz75wPZwhjq_ilO_7WgPaHSxjX_Isgd90DEs','2026-05-14 12:19:53.500748','2026-05-21 12:19:53.000000',2,'327e38786aaf4496a1914253def1e19d'),(44,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTM5MDIzNiwiaWF0IjoxNzc4Nzg1NDM2LCJqdGkiOiI4N2VmNjFmOTU4OGM0OWQwOTQ1OWIxY2ZiZmIxYTBjZSIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.PtfSbuTJT1BAE6vKaJAz92bdS2VgPAfLkDAKfDdhDKg','2026-05-14 19:03:56.705575','2026-05-21 19:03:56.000000',2,'87ef61f9588c49d09459b1cfbfb1a0ce'),(45,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTM5MDI2MSwiaWF0IjoxNzc4Nzg1NDYxLCJqdGkiOiJiYWVjNWQxNjE0NzQ0YmEyYWEzYjRlMTU4NzliZGE3NSIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9._oGIAdIgzUQ2NVr8_GXEIbod3eiwLf2984B3fva8mgc','2026-05-14 19:04:21.491057','2026-05-21 19:04:21.000000',6,'baec5d1614744ba2aa3b4e15879bda75'),(46,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTUwMTY3OSwiaWF0IjoxNzc4ODk2ODc5LCJqdGkiOiI0NzFkNDNiOGNhOGQ0M2M1OWQyYjliZmIxNTMwODkwMyIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.Fo7n7EH1Zc8gglYRHR4G20_nrxlE69MwWs6jNrgai5o','2026-05-16 02:01:19.349259','2026-05-23 02:01:19.000000',2,'471d43b8ca8d43c59d2b9bfb15308903'),(47,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTUwNjQ3MSwiaWF0IjoxNzc4OTAxNjcxLCJqdGkiOiI0ZmYyMTllMDhmYzQ0Y2ZhYTlhODgyZTgxYTljZWU5YyIsInVzZXJfaWQiOiIyIn0.9AicKIk8C0Vy8sS9Rp-m8mukX4UtPTrP34Jg7m96OFs','2026-05-16 03:21:11.333646','2026-05-23 03:21:11.000000',2,'4ff219e08fc44cfaa9a882e81a9cee9c'),(48,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTUzNjAyNywiaWF0IjoxNzc4OTMxMjI3LCJqdGkiOiJhMTI3MWJkZmNiYzA0Nzg5OWQwYzg4Yjk4NmM2NGIxYiIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.R-6KdiDWfMtgEg7cgsbK9ft0gC5PcrDQ3AhJgUPL12c','2026-05-16 11:33:47.187570','2026-05-23 11:33:47.000000',2,'a1271bdfcbc047899d0c88b986c64b1b'),(49,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTU0NTA2NCwiaWF0IjoxNzc4OTQwMjY0LCJqdGkiOiJiMzE4MWMzZjhkN2U0OTI2OGE3MjdmMmQwMDFiNmI2YSIsInVzZXJfaWQiOiIyIn0.aUC9caKLkOj6oMT9fXyoNRCaqAcc16tL4ChJBjN7m8Y','2026-05-16 14:04:24.787220','2026-05-23 14:04:24.000000',2,'b3181c3f8d7e49268a727f2d001b6b6a'),(50,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTU1MzQ5MiwiaWF0IjoxNzc4OTQ4NjkyLCJqdGkiOiIxZDlhYzU5YTk1OTE0MTA0OTg0YTg3NDlhYzgxZjA5NSIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.zmaTy7tOLWJJL6dr0z9ntwoTILsMUdBIsKbP-nQDqs0','2026-05-16 16:24:52.764332','2026-05-23 16:24:52.000000',2,'1d9ac59a95914104984a8749ac81f095'),(51,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTU2NzE5NywiaWF0IjoxNzc4OTYyMzk3LCJqdGkiOiIxNzliNDkwZTE1MjA0MDUzYTgwMTBkOWZmZWU0MGE5YyIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.binwyBNbEDLdS7oSM2L1xmBliDneN0mQUMOgF756yLM','2026-05-16 20:13:17.513649','2026-05-23 20:13:17.000000',2,'179b490e15204053a8010d9ffee40a9c'),(52,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTU2NzM0MSwiaWF0IjoxNzc4OTYyNTQxLCJqdGkiOiJiZTE4MmMxZTBjN2I0ZDQ4OWQ4YjFiMTg0YWM1MDJjOSIsInVzZXJfaWQiOiIyIn0.Q5ywKsaQ8GOvHWvy3M9ehKUkwJrekNED2QMv4qmyEJM','2026-05-16 20:15:41.038832','2026-05-23 20:15:41.000000',2,'be182c1e0c7b4d489d8b1b184ac502c9'),(53,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTU3NDYwOCwiaWF0IjoxNzc4OTY5ODA4LCJqdGkiOiIxYWNjZmE2ODM1MGM0MDc1ODE1MWI2YmY5Y2Y3YzU0NSIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.4Gz5fzQsih9HJmhpbp5tn-u7PGPXpAM69FLVMIVqxgc','2026-05-16 22:16:48.812682','2026-05-23 22:16:48.000000',2,'1accfa68350c40758151b6bf9cf7c545'),(54,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTcwNjI1MiwiaWF0IjoxNzc5MTAxNDUyLCJqdGkiOiI5Njk0YTBiNWRkMTA0Y2VlODRjNGFhOWFhYTk1Yjc1MCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.9I30t2b5tjcb13H93UeAsL3fkVxE7rJSBNGydOcEvFc','2026-05-18 10:50:52.139993','2026-05-25 10:50:52.000000',2,'9694a0b5dd104cee84c4aa9aaa95b750'),(55,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTcxMzQ3MiwiaWF0IjoxNzc5MTA4NjcyLCJqdGkiOiJkNWJiMGIxNDM0M2I0YzlkYmUwYTVhNGViNDcwZDBkOCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.2BSniC_ENwNjl4MGf7ZQRCD0ZnxQUHDdQQ38QDjcPwc','2026-05-18 12:51:12.696478','2026-05-25 12:51:12.000000',2,'d5bb0b14343b4c9dbe0a5a4eb470d0d8'),(56,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTcyMDcwMiwiaWF0IjoxNzc5MTE1OTAyLCJqdGkiOiI0Yzg0ZTBjYWM0M2M0MWU0YWZkZDBkMDIyMmY4MmE3OCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.UR01_j-dwuwCM9rEe7TPZ2SGxdtBA5v_-z4Qwx9lbi8','2026-05-18 14:51:42.667485','2026-05-25 14:51:42.000000',2,'4c84e0cac43c41e4afdd0d0222f82a78'),(57,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0MDY2MSwiaWF0IjoxNzc5MTM1ODYxLCJqdGkiOiI0ZTg4YmZmZGVmNDU0YjA5OTdhMDQyNjVmMWI1YjM3NCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.uRYgIz0XgeUaDGIEqfkxABx6WC1E_MKqjHStEhGZm4Q','2026-05-18 20:24:21.808811','2026-05-25 20:24:21.000000',2,'4e88bffdef454b0997a04265f1b5b374'),(58,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0MjIzMiwiaWF0IjoxNzc5MTM3NDMyLCJqdGkiOiIyNDM5NTgyMGIzZmY0NDg0OTk0ZmRiYWI3NmE5Y2ZiNCIsInVzZXJfaWQiOiIxNCJ9.N_qAbbLXEex7Wwn_ILBg4N1lFnQ11o1FgurXMU1e0T0','2026-05-18 20:50:32.656423','2026-05-25 20:50:32.000000',14,'24395820b3ff4484994fdbab76a9cfb4'),(59,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0MjI0NiwiaWF0IjoxNzc5MTM3NDQ2LCJqdGkiOiI5MWJmYzg5N2QzYWI0YzZkODZiZTYyOGY3NGYwNDk1YyIsInVzZXJfaWQiOiIxNCJ9.tvnGB9DFBbaIEHMNqeP__-4XgOVwnVyXFdDoU2SFvSk','2026-05-18 20:50:46.628118','2026-05-25 20:50:46.000000',14,'91bfc897d3ab4c6d86be628f74f0495c'),(60,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0MjI5OCwiaWF0IjoxNzc5MTM3NDk4LCJqdGkiOiJmZTI1OWIwNGJlYjg0ZmQ1OTRjNGYwYzM2ZmUzMjBkZSIsInVzZXJfaWQiOiI2In0.-C6sVWVweBMfoEYOeq2P7u7hBAF2O3gBd-emmlSBua4','2026-05-18 20:51:38.283404','2026-05-25 20:51:38.000000',6,'fe259b04beb84fd594c4f0c36fe320de'),(61,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0MjgzOSwiaWF0IjoxNzc5MTM4MDM5LCJqdGkiOiJkOWMwMjFjNWM5M2U0MjNmYTM1ZmVlYTQ1YjFlYTJjMSIsInVzZXJfaWQiOiIzIn0.NRVY7Xo_3dtDS8Z4Woy_fnfSUa6v6qvz36vEC7-VGg0','2026-05-18 21:00:39.555474','2026-05-25 21:00:39.000000',3,'d9c021c5c93e423fa35feea45b1ea2c1'),(62,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwMCwiaWF0IjoxNzc5MTQxOTAwLCJqdGkiOiJiNjJiNjZhNjJkYzA0MDk0YjEzNThiZGM1NjdlOGJjMCIsInVzZXJfaWQiOiIzIn0.kFSft7vuCXL6OLAT1d1Cca6YsuJ4aNCYgOAZ_cXCOlE','2026-05-18 22:05:00.685983','2026-05-25 22:05:00.000000',3,'b62b66a62dc04094b1358bdc567e8bc0'),(63,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwMCwiaWF0IjoxNzc5MTQxOTAwLCJqdGkiOiIyNmNkMzg2NDUzZDk0NWU0OGU2OWExZGJlOTE3NGMzOCIsInVzZXJfaWQiOiIyIn0.wWGQC0FfC15bn4C-HwWVHqJbhqgUGll0XnuXeXR3EHU','2026-05-18 22:05:00.688615','2026-05-25 22:05:00.000000',2,'26cd386453d945e48e69a1dbe9174c38'),(64,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwMCwiaWF0IjoxNzc5MTQxOTAwLCJqdGkiOiI2MTA4NmFmODBjMjY0MDQ5ODc4ZGNkMThhMGI3ZjIwNyIsInVzZXJfaWQiOiIyIn0.Tv1952ojRw1l9GMWdh53LWFYwZauw2CDpK9Ex3OEYmU','2026-05-18 22:05:00.720148','2026-05-25 22:05:00.000000',2,'61086af80c264049878dcd18a0b7f207'),(65,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwMCwiaWF0IjoxNzc5MTQxOTAwLCJqdGkiOiJjYjE3NzFjMjU5MTU0ZjkwOWY3ZDA5MjI4MzcwMTExNiIsInVzZXJfaWQiOiIxNSJ9.h0oSAgM6REkYKOHkYy-frJmYFQnHfoI5T-ZDMgyB8ns','2026-05-18 22:05:00.741535','2026-05-25 22:05:00.000000',15,'cb1771c259154f909f7d092283701116'),(66,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwNCwiaWF0IjoxNzc5MTQxOTA0LCJqdGkiOiIyOTU2YzFmNzQ5Y2U0MThlOTA5MTU0Yzk5YjJlZDhkNiIsInVzZXJfaWQiOiIyIn0.bRKZHYSmnrbnaJN7S87D7m9bxLTh8gL7Sy0KEePCrPw','2026-05-18 22:05:04.558668','2026-05-25 22:05:04.000000',2,'2956c1f749ce418e909154c99b2ed8d6'),(67,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwNSwiaWF0IjoxNzc5MTQxOTA1LCJqdGkiOiI1YTE0NDczMTY1YzQ0MzBkYjQxMjhiOGYzY2VjNGY5YiIsInVzZXJfaWQiOiIzIn0.jWy7jTtkhIqyXWAj836UWKx_B3YKsJOJ3k2dUiSNLko','2026-05-18 22:05:05.205321','2026-05-25 22:05:05.000000',3,'5a14473165c4430db4128b8f3cec4f9b'),(68,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcwOSwiaWF0IjoxNzc5MTQxOTA5LCJqdGkiOiIwNWFjNTRmZTcwOWU0NTQ2OTdmN2FiOTNhMmU1ZDcyNiIsInVzZXJfaWQiOiIyIn0.EjZCn6RVtpPBIPXd-F-O60_Py8dDMw32ZT93hzXdAeM','2026-05-18 22:05:09.059840','2026-05-25 22:05:09.000000',2,'05ac54fe709e454697f7ab93a2e5d726'),(69,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcxMiwiaWF0IjoxNzc5MTQxOTEyLCJqdGkiOiJiZDQ3Yzc5ZTRlN2M0N2VhYTM0YWExYWEyMjdjYjA0MCIsInVzZXJfaWQiOiIzIn0.RYrxpMInhIJ_JjgW6Bcrh9rM9IG_yfKTl2mLLbzF3MM','2026-05-18 22:05:12.487305','2026-05-25 22:05:12.000000',3,'bd47c79e4e7c47eaa34aa1aa227cb040'),(70,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcxNSwiaWF0IjoxNzc5MTQxOTE1LCJqdGkiOiI3MjhiMjU4OTJhY2E0NzIzOWQ4NTBjNTY0NmFlNTBkMCIsInVzZXJfaWQiOiIyIn0.0rWwy1uAC16lm8bMFI-sYaStovVv5sndARg-LZEdAeg','2026-05-18 22:05:15.766721','2026-05-25 22:05:15.000000',2,'728b25892aca47239d850c5646ae50d0'),(71,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcxNywiaWF0IjoxNzc5MTQxOTE3LCJqdGkiOiJmOWI5MmU3M2E1NTk0NGJlYjM0YjIyZjUxYmYwYWU0ZCIsInVzZXJfaWQiOiIzIn0.z9J22XmrFJja2oICL3Rfpkcuii4xJJt4KeFddloNJJ0','2026-05-18 22:05:17.892042','2026-05-25 22:05:17.000000',3,'f9b92e73a55944beb34b22f51bf0ae4d'),(72,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcxOSwiaWF0IjoxNzc5MTQxOTE5LCJqdGkiOiI0YjQ2ODRiNGNjN2U0NmYwYTgwYTdmYzRkOGZiNTY4MiIsInVzZXJfaWQiOiIxNSJ9.BGuxzuJTUQfSVEcjORcpWNObzr0HETp4Jrm4Bt2KMGc','2026-05-18 22:05:19.122646','2026-05-25 22:05:19.000000',15,'4b4684b4cc7e46f0a80a7fc4d8fb5682'),(73,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcyMiwiaWF0IjoxNzc5MTQxOTIyLCJqdGkiOiIxNTY4YzIxY2I2NjA0MDkzYjI3OGIwOWRmMDU4N2QzYiIsInVzZXJfaWQiOiIzIn0.iligsSICj1QpFcyOmoJQDyL6PjAZw3HvDpczfzpwhLI','2026-05-18 22:05:22.228649','2026-05-25 22:05:22.000000',3,'1568c21cb6604093b278b09df0587d3b'),(74,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcyMiwiaWF0IjoxNzc5MTQxOTIyLCJqdGkiOiI1ODQ3Njc5YmIyNmM0Mjg4YTIzODdhMzllNzY5NWMxMSIsInVzZXJfaWQiOiIyIn0.Nh_1Jds7RC2DOepnXZVRkiB1J97uWvfFUoduS0dsCq8','2026-05-18 22:05:22.526950','2026-05-25 22:05:22.000000',2,'5847679bb26c4288a2387a39e7695c11'),(75,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcyOCwiaWF0IjoxNzc5MTQxOTI4LCJqdGkiOiI4YmQwYjY0YThkMzU0MjY4OThhYTRkM2RiMWEwZjEzNyIsInVzZXJfaWQiOiIyIn0.JSdyOAVuGWTG8kydv5ETIBBuHD5B8qfNbObfevO0L4A','2026-05-18 22:05:28.750920','2026-05-25 22:05:28.000000',2,'8bd0b64a8d35426898aa4d3db1a0f137'),(76,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjcyOSwiaWF0IjoxNzc5MTQxOTI5LCJqdGkiOiIzMTUwODAwYmY2OTM0MjExYWQxMDcwN2QyNzA5Njc0ZCIsInVzZXJfaWQiOiIzIn0.5eTmn2EYHhNsod63rZ3s_i_aPMChr_YEiM24xOLJKrk','2026-05-18 22:05:29.565650','2026-05-25 22:05:29.000000',3,'3150800bf6934211ad10707d2709674d'),(77,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjczNSwiaWF0IjoxNzc5MTQxOTM1LCJqdGkiOiI2OTlhMjMxZmFiMjM0MDRmYWMzMmIxYmUyOGY5YjFmNyIsInVzZXJfaWQiOiIyIn0.7QYLbZJMZMi_6PYMjTq3W4RHgvjcUF1rspQ0ieO9bjA','2026-05-18 22:05:35.043079','2026-05-25 22:05:35.000000',2,'699a231fab23404fac32b1be28f9b1f7'),(78,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjczNiwiaWF0IjoxNzc5MTQxOTM2LCJqdGkiOiJhOWJiMmIxNzIwOWY0MjM4YTJmOWQ0ZTZiOTJjY2U2ZiIsInVzZXJfaWQiOiIzIn0.fsHZJ1uZ8DHJZO6oNlIXPRfI9JX9_bvTP5j7Wj1D3xs','2026-05-18 22:05:36.953110','2026-05-25 22:05:36.000000',3,'a9bb2b17209f4238a2f9d4e6b92cce6f'),(79,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjczNywiaWF0IjoxNzc5MTQxOTM3LCJqdGkiOiIzNjNjMDZmNzk2MjM0ZmYyYmI0NmExNDBiMmRlNjJkNSIsInVzZXJfaWQiOiIxNSJ9.yKg8kxiyVCc6s1lvcMaFbkSYb_ncUeoJkjiSyeEboK0','2026-05-18 22:05:37.507290','2026-05-25 22:05:37.000000',15,'363c06f796234ff2bb46a140b2de62d5'),(80,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0Njc1NCwiaWF0IjoxNzc5MTQxOTU0LCJqdGkiOiJmOTIyOTMzNGNiMWU0Y2MwOGQ4YzZhY2M1Y2NiY2VhYSIsInVzZXJfaWQiOiIxNSJ9.XFAZph2yA3JDNQeOp3gzhjmy2IR6MYCGjxb1aqGe3Jo','2026-05-18 22:05:54.566778','2026-05-25 22:05:54.000000',15,'f9229334cb1e4cc08d8c6acc5ccbceaa'),(81,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0Njc3MSwiaWF0IjoxNzc5MTQxOTcxLCJqdGkiOiIzMDliMDgxN2FhYWY0NDM4ODJlYmQxMzYxY2NjNjU0NSIsInVzZXJfaWQiOiIxNSJ9.rq9h8bitn1NfTeRgHFCIZppQY7gCtSRPaXCAuegjawE','2026-05-18 22:06:11.932027','2026-05-25 22:06:11.000000',15,'309b0817aaaf443882ebd1361ccc6545'),(82,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0Njc4OSwiaWF0IjoxNzc5MTQxOTg5LCJqdGkiOiIwZmZiMWY4YmFmZGU0Y2RiYTFiNjQ5MmVkOTI3MDc2OCIsInVzZXJfaWQiOiIxNSJ9.Rj_3Aj8Tz8uXhbVVsB2gfyg-j778X9VzKOUNLJUs6Xo','2026-05-18 22:06:29.293503','2026-05-25 22:06:29.000000',15,'0ffb1f8bafde4cdba1b6492ed9270768'),(83,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjkyMSwiaWF0IjoxNzc5MTQyMTIxLCJqdGkiOiIxY2I5NGJhMzViMmQ0MDEwODBlMmNhODhhMTZiYWIwMCIsInVzZXJfaWQiOiIxNSJ9.4t75ATLMHSny17nqKhxkCFiI_v31GLvHDKsm8oD12GI','2026-05-18 22:08:41.211631','2026-05-25 22:08:41.000000',15,'1cb94ba35b2d401080e2ca88a16bab00'),(84,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NjkzMywiaWF0IjoxNzc5MTQyMTMzLCJqdGkiOiJmOTY0ZGZkZmFhN2M0NjQ0YmU1MzhlNTQ2YTE4NTEyNiIsInVzZXJfaWQiOiIxNSJ9.b10KjMt2-t3NnQUJhPq-7oldmyIRm-Gn-NFCK3WKuFE','2026-05-18 22:08:53.849948','2026-05-25 22:08:53.000000',15,'f964dfdfaa7c4644be538e546a185126'),(85,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0MywiaWF0IjoxNzc5MTQyMjQzLCJqdGkiOiI0ZTdjNTNiYWI5MTQ0MWEzODQ4OGZmMjFhNTExZjlkYSIsInVzZXJfaWQiOiIxNSJ9.fY4yHhbmHQmveClRMC5_dEGqpTLV230Fv4-SyOVfmcs','2026-05-18 22:10:43.030430','2026-05-25 22:10:43.000000',15,'4e7c53bab91441a38488ff21a511f9da'),(86,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0MywiaWF0IjoxNzc5MTQyMjQzLCJqdGkiOiIwMmY2YWE5NTc3YjQ0ZTc5YjM4ZDEwMDQxNTRiMTA2YSIsInVzZXJfaWQiOiIyIn0.BEM-irYi30SMUMQ3Et3d14o0QYyWKxIw6Sxrc1KkpVM','2026-05-18 22:10:43.127081','2026-05-25 22:10:43.000000',2,'02f6aa9577b44e79b38d1004154b106a'),(87,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0MywiaWF0IjoxNzc5MTQyMjQzLCJqdGkiOiJkNWYyYjQyMDBjY2Q0NWM5OWZiYTVkNzBiZmUzZTBjYSIsInVzZXJfaWQiOiIyIn0._aJVTUfVUS5MJYIr9VRn7lCaSlzTMyQ7NI7ONM8gGoI','2026-05-18 22:10:43.188799','2026-05-25 22:10:43.000000',2,'d5f2b4200ccd45c99fba5d70bfe3e0ca'),(88,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0MywiaWF0IjoxNzc5MTQyMjQzLCJqdGkiOiJlYmNmM2RjMjllYTI0YTM0OGZmMTFhZDk3YzhjMzYyYyIsInVzZXJfaWQiOiIzIn0.YdBm2reQ4LsWQ17TNCDqVkcFRc3jBY-d6CbZiepzOVE','2026-05-18 22:10:43.249625','2026-05-25 22:10:43.000000',3,'ebcf3dc29ea24a348ff11ad97c8c362c'),(89,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0NiwiaWF0IjoxNzc5MTQyMjQ2LCJqdGkiOiIxZjczZDg1MDA2N2M0M2I0OTBiYTkwYjY1N2EzYWVhNyIsInVzZXJfaWQiOiIzIn0.jljyz6KMU9rgXFQ0AZ4tj6YgvdNwJrhZZN6pxJOHd5A','2026-05-18 22:10:46.791387','2026-05-25 22:10:46.000000',3,'1f73d850067c43b490ba90b657a3aea7'),(90,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0NywiaWF0IjoxNzc5MTQyMjQ3LCJqdGkiOiIwNTYzZDdmNDY5OTk0NjkwOGUxMzlmNDFiNmZjZDkyMCIsInVzZXJfaWQiOiIyIn0.FUyGiGG4aTjXWl5NuJeCOTtLUgVgm4rBRJNH-Y0Frk4','2026-05-18 22:10:47.205009','2026-05-25 22:10:47.000000',2,'0563d7f4699946908e139f41b6fcd920'),(91,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA0NywiaWF0IjoxNzc5MTQyMjQ3LCJqdGkiOiI5NzEzN2MzZWM1Y2U0YTczYmE0OTUyYjk0NzdkYzhjZSIsInVzZXJfaWQiOiIxNSJ9.1N4o9hNef1SOKKOhSY17zMM1sm0kocA0YKHRMtLgITU','2026-05-18 22:10:47.892726','2026-05-25 22:10:47.000000',15,'97137c3ec5ce4a73ba4952b9477dc8ce'),(92,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA1MiwiaWF0IjoxNzc5MTQyMjUyLCJqdGkiOiI5MDc1OGYzODUyNDI0NTUzOTM3MjkxNmYwYTg4ZmYzMiIsInVzZXJfaWQiOiIyIn0.MnaykzScuwOSY5DRflsDodRX0IjJSTQFXJPnzVpV11g','2026-05-18 22:10:52.033106','2026-05-25 22:10:52.000000',2,'90758f38524245539372916f0a88ff32'),(93,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA1MywiaWF0IjoxNzc5MTQyMjUzLCJqdGkiOiIxYWE0ZmNiOWJhMjg0NTAyYmUxYjBiYjgzOWVkNGM5MyIsInVzZXJfaWQiOiIxNSJ9.74TsM41UczDSntJQymiosHOvJpgbsE734Q63oRbEbZw','2026-05-18 22:10:53.047437','2026-05-25 22:10:53.000000',15,'1aa4fcb9ba284502be1b0bb839ed4c93'),(94,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA1NSwiaWF0IjoxNzc5MTQyMjU1LCJqdGkiOiI4MWMzOWE3YzNlNmU0NjNlYjVjMTc1YWI5MWU1NjM4NiIsInVzZXJfaWQiOiIzIn0.tCftwMFu8KFFUx-STxViwHzN2VZ7ov-McvYH7G9VweM','2026-05-18 22:10:55.721296','2026-05-25 22:10:55.000000',3,'81c39a7c3e6e463eb5c175ab91e56386'),(95,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA1OSwiaWF0IjoxNzc5MTQyMjU5LCJqdGkiOiJlYjdkYjk5MjkwZWI0MTFjYjM4MGIyOGQ0OWJlOGE5NyIsInVzZXJfaWQiOiIxNSJ9.0yXlUdfhLsQXBCBXiBHtLFPVoW1nxNMfF-3kL-CDCR4','2026-05-18 22:10:59.181036','2026-05-25 22:10:59.000000',15,'eb7db99290eb411cb380b28d49be8a97'),(96,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA2MCwiaWF0IjoxNzc5MTQyMjYwLCJqdGkiOiI2OTlkZGVkNWNiMjk0OWVhODNkOGJkMmMxZmRiNzRmYyIsInVzZXJfaWQiOiIyIn0.ZiCHXGbJXcPMVf90kVoKrMx2VUkp8gl6fO2JAxmqBHs','2026-05-18 22:11:00.347771','2026-05-25 22:11:00.000000',2,'699dded5cb2949ea83d8bd2c1fdb74fc'),(97,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA2MSwiaWF0IjoxNzc5MTQyMjYxLCJqdGkiOiI1ZWMzNmVlYTAwY2I0YmY1YWFlNGMzMGNjOWRmNDg2MiIsInVzZXJfaWQiOiIzIn0.7BFowk52JtTTYbWdcPyGcynwkkBBHh1FEe-rAPHh7Pc','2026-05-18 22:11:01.173112','2026-05-25 22:11:01.000000',3,'5ec36eea00cb4bf5aae4c30cc9df4862'),(98,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA2NCwiaWF0IjoxNzc5MTQyMjY0LCJqdGkiOiIxNDZlNGQ2ZmM3MTA0OWE3YTIwYjc0YTdhMjcxZGE1MyIsInVzZXJfaWQiOiIxNSJ9.A9VEazm4nUqVsoTTOn53VmQifoiEn_mTB4WA6CXabtg','2026-05-18 22:11:04.014822','2026-05-25 22:11:04.000000',15,'146e4d6fc71049a7a20b74a7a271da53'),(99,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA2NiwiaWF0IjoxNzc5MTQyMjY2LCJqdGkiOiJhY2FmYjQ0NWIwODQ0OGJlYTNiMTZkNWUwNWIxYjM2NiIsInVzZXJfaWQiOiIzIn0.I3Ol-t18xsT6Je35RjFE2p9afWgVkbgorOPPfws4PQ0','2026-05-18 22:11:06.246814','2026-05-25 22:11:06.000000',3,'acafb445b08448bea3b16d5e05b1b366'),(100,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA2NywiaWF0IjoxNzc5MTQyMjY3LCJqdGkiOiI5YzQzYmFhNmJiZjg0ZTYyOTZkZDQ4ZjY2MWM2ODVlNSIsInVzZXJfaWQiOiIyIn0.hziF4BQ6TCgITVwY8HvVKOiBcm-MsmMJqzCW1-Zjypg','2026-05-18 22:11:07.439249','2026-05-25 22:11:07.000000',2,'9c43baa6bbf84e6296dd48f661c685e5'),(101,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA3MywiaWF0IjoxNzc5MTQyMjczLCJqdGkiOiI3ZWRkNTczM2MxOWQ0YzQ5YjZjYTYyM2JlZTI4OTYwNCIsInVzZXJfaWQiOiIzIn0.I-iaXq-Sql7FAX0DtZWoUj9zJxG1LXJpzcEqOaeQYl8','2026-05-18 22:11:13.463981','2026-05-25 22:11:13.000000',3,'7edd5733c19d4c49b6ca623bee289604'),(102,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA3MywiaWF0IjoxNzc5MTQyMjczLCJqdGkiOiIzOTViNmY1ODUzYmU0YTBhYjk1OGNkYzJlODc0YTUzOCIsInVzZXJfaWQiOiIyIn0.2V59kjNWmMlCRcuoA7JoNlLcVw-GXCZn23feEwTsOn4','2026-05-18 22:11:13.860575','2026-05-25 22:11:13.000000',2,'395b6f5853be4a0ab958cdc2e874a538'),(103,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA3OCwiaWF0IjoxNzc5MTQyMjc4LCJqdGkiOiJhNmYwYWE2OWJlMmI0ODAwYTFmZjBiYWIxMDliZjFjNCIsInVzZXJfaWQiOiIxNSJ9.aMvEt2Gvz3cHCfCviru6AZfJM0ez_sxEONTdHGcVzd8','2026-05-18 22:11:18.778788','2026-05-25 22:11:18.000000',15,'a6f0aa69be2b4800a1ff0bab109bf1c4'),(104,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA4MCwiaWF0IjoxNzc5MTQyMjgwLCJqdGkiOiJjZWIxMDdiYzVhMjM0NjIyYWQ2MGE4OWIwYzg3MWY3YiIsInVzZXJfaWQiOiIyIn0.EFSOXB0ULNViZG9VwcYFDKqijpGmJ5Pz5iLrYUe5WXI','2026-05-18 22:11:20.406784','2026-05-25 22:11:20.000000',2,'ceb107bc5a234622ad60a89b0c871f7b'),(105,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzA4MSwiaWF0IjoxNzc5MTQyMjgxLCJqdGkiOiI3NWJkZTI0OWU1MDU0MTVjOWQ4NjM0ZDMwOGE1ODllYyIsInVzZXJfaWQiOiIzIn0._2DLpsqWgRhxdN8_KUYbxw_MvxqZ0aDEPPImLHxgiFU','2026-05-18 22:11:21.012690','2026-05-25 22:11:21.000000',3,'75bde249e505415c9d8634d308a589ec'),(106,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0MywiaWF0IjoxNzc5MTQyNjQzLCJqdGkiOiJhNDA2MjFiMGJkZDg0ODUwOWM5M2VmZDE2M2I0NTg1NyIsInVzZXJfaWQiOiIyIn0.2_g24HvwtJCHCFW38Q5nZLBErQrCth11m9-bOhWOd60','2026-05-18 22:17:23.367928','2026-05-25 22:17:23.000000',2,'a40621b0bdd848509c93efd163b45857'),(107,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0MywiaWF0IjoxNzc5MTQyNjQzLCJqdGkiOiJhNGVkZTRmOWQ0ZWQ0YTkzYTc0NWQyNTczNTc5YTUxMSIsInVzZXJfaWQiOiIzIn0.Fq0MmN1LwT1KiM5PHlEEnOB1ELadXhhWSLSNWo_QGE8','2026-05-18 22:17:23.390491','2026-05-25 22:17:23.000000',3,'a4ede4f9d4ed4a93a745d2573579a511'),(108,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0MywiaWF0IjoxNzc5MTQyNjQzLCJqdGkiOiI3ZWEyNmI1MzA0NmU0NDZiYjc2MzMxYTU3NTYxZTVjNCIsInVzZXJfaWQiOiIxNSJ9.wKzgle_NRdKsfFaTUPlmx7NH7qWEcNlBqQhovKx2ThU','2026-05-18 22:17:23.609023','2026-05-25 22:17:23.000000',15,'7ea26b53046e446bb76331a57561e5c4'),(109,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0MywiaWF0IjoxNzc5MTQyNjQzLCJqdGkiOiJmYjVkOTFlZDM2ZGE0NWM0OGMxNTlmMjY0OGU0Y2NmMiIsInVzZXJfaWQiOiIyIn0.UCCfGNVCcxBFesoqKjRu_QW_oKe6fth0e0WLgqFwZ0Q','2026-05-18 22:17:23.645241','2026-05-25 22:17:23.000000',2,'fb5d91ed36da45c48c159f2648e4ccf2'),(110,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0NywiaWF0IjoxNzc5MTQyNjQ3LCJqdGkiOiI4NTBjOTEwYmEyYTY0ZDY5ODhjNGNjMDVjOGU4NmVhOSIsInVzZXJfaWQiOiIzIn0.ZlprsET849tKMj0uNqvL-8idGWROi1JbSwB5XjlAsEw','2026-05-18 22:17:27.901199','2026-05-25 22:17:27.000000',3,'850c910ba2a64d6988c4cc05c8e86ea9'),(111,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0OCwiaWF0IjoxNzc5MTQyNjQ4LCJqdGkiOiJiM2M2ZGZiY2EzOTA0YjA3YmI4YTI2MzU3NWE2YTc1MiIsInVzZXJfaWQiOiIyIn0.tA3Guv-wFCXaFejLTvOaMRYQYb6oUgnHbpCoMajHu3k','2026-05-18 22:17:28.184914','2026-05-25 22:17:28.000000',2,'b3c6dfbca3904b07bb8a263575a6a752'),(112,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ0OSwiaWF0IjoxNzc5MTQyNjQ5LCJqdGkiOiI2YmE3MjJjNzcwNTY0N2U1YTEyN2JhZjEwNGQxMjJhNiIsInVzZXJfaWQiOiIxNSJ9.huWjlZb7CPVfMTFtqUj5E_f9_n8YqMscBHQR2XWw_L4','2026-05-18 22:17:29.444869','2026-05-25 22:17:29.000000',15,'6ba722c7705647e5a127baf104d122a6'),(113,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ1NCwiaWF0IjoxNzc5MTQyNjU0LCJqdGkiOiJlODdhNzg3ODJmMmE0NTA1OWQxZTVmNDJjNGZmMmIwMyIsInVzZXJfaWQiOiIyIn0.r-6FFHxuLFh6g-HrBgy1Te5-wtq4AlzhzsitfMo1asw','2026-05-18 22:17:34.484164','2026-05-25 22:17:34.000000',2,'e87a78782f2a45059d1e5f42c4ff2b03'),(114,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ1NSwiaWF0IjoxNzc5MTQyNjU1LCJqdGkiOiIxNzA3ZWFlYTI1NGI0MzA0OTFiMjEyNTE4OGMyN2U1NCIsInVzZXJfaWQiOiIxNSJ9.vfkzPcqKm03axU3AS_aacx752SGuz4DZ4RpHCLH6g_s','2026-05-18 22:17:35.688995','2026-05-25 22:17:35.000000',15,'1707eaea254b430491b2125188c27e54'),(115,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ1NywiaWF0IjoxNzc5MTQyNjU3LCJqdGkiOiIxNWVmNWQ5NjdhYjU0OGIzODQ4NTVmNGI4ZjI5YWFlYyIsInVzZXJfaWQiOiIzIn0.AdbEm0zEnyGZvFw54ocZVuhfB_-iL-A1151t831aMN8','2026-05-18 22:17:37.298459','2026-05-25 22:17:37.000000',3,'15ef5d967ab548b384855f4b8f29aaec'),(116,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2MCwiaWF0IjoxNzc5MTQyNjYwLCJqdGkiOiIxNGMyZmZhZDJkN2Y0OTYzOWE5MDFmNzNmYWFjM2U5ZCIsInVzZXJfaWQiOiIxNSJ9.fTp7bwJAU6_aAIK4paRtXPt0F2y0KSEQ8IVyfp0zuJ4','2026-05-18 22:17:40.189099','2026-05-25 22:17:40.000000',15,'14c2ffad2d7f49639a901f73faac3e9d'),(117,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2MSwiaWF0IjoxNzc5MTQyNjYxLCJqdGkiOiIxNGM3MWZiY2RiOWQ0NzVkOWM5YmYzOWY5ZmRmMTY3YyIsInVzZXJfaWQiOiIzIn0.zXXachA1QlMhemSL1rthUQMMpS28wMJNPVQ0eW2vM_M','2026-05-18 22:17:41.604728','2026-05-25 22:17:41.000000',3,'14c71fbcdb9d475d9c9bf39f9fdf167c'),(118,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2MiwiaWF0IjoxNzc5MTQyNjYyLCJqdGkiOiI1OWQzNTIxOTczNWE0ZjQxYTJlMzM3MGY4ZDI5MTAyMiIsInVzZXJfaWQiOiIyIn0.yFtF66S-UsAYlTILkRE7G_74b1bdajULliJXtLO0hqw','2026-05-18 22:17:42.413500','2026-05-25 22:17:42.000000',2,'59d35219735a4f41a2e3370f8d291022'),(119,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2NCwiaWF0IjoxNzc5MTQyNjY0LCJqdGkiOiJiNDViYTgyYTc2MmE0OGQ3YTBhZDhhMzAzMGYwZDE2ZiIsInVzZXJfaWQiOiIxNSJ9.dTRNpKw_Tn4DaKfFctdP0YvatHdSpewr0szPcWHbAhY','2026-05-18 22:17:44.964762','2026-05-25 22:17:44.000000',15,'b45ba82a762a48d7a0ad8a3030f0d16f'),(120,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2NiwiaWF0IjoxNzc5MTQyNjY2LCJqdGkiOiIzMjVmMWRiNjc3ODc0OTQ3OTk0YjIxMjJhMDI2MzEzZiIsInVzZXJfaWQiOiIzIn0.0nrIXYY_RqfrSLq-_9VefICNIJNWc6uCuzBpt1ipybo','2026-05-18 22:17:46.014285','2026-05-25 22:17:46.000000',3,'325f1db677874947994b2122a026313f'),(121,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ2OCwiaWF0IjoxNzc5MTQyNjY4LCJqdGkiOiJjZGU5ZTI0MTZhMzY0ZTIyYjk5N2QzNDAwN2Y3NGQ3MiIsInVzZXJfaWQiOiIyIn0.QWExLtaVXmNJO6MnxFR-Gqi5DspDGtPTpwso96mRikQ','2026-05-18 22:17:48.912276','2026-05-25 22:17:48.000000',2,'cde9e2416a364e22b997d34007f74d72'),(122,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ3MiwiaWF0IjoxNzc5MTQyNjcyLCJqdGkiOiJiNmFlNTU0YTZjNDA0MzIxYjg3OGYyZGVkMmQ3NWZkNCIsInVzZXJfaWQiOiIzIn0.nOmOrNzq5x7UTIeH94qlmemYYNvW7aaDhafSGUfV0C8','2026-05-18 22:17:52.938074','2026-05-25 22:17:52.000000',3,'b6ae554a6c404321b878f2ded2d75fd4'),(123,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ3NSwiaWF0IjoxNzc5MTQyNjc1LCJqdGkiOiIxNDU0NjY0ZjJhZGI0NWNiOTg0MDU5ZDM3NjUxOWFlYSIsInVzZXJfaWQiOiIyIn0.sWhxNdWT-JdblJ9I-Ck1QG1GSNK5KPH6TwGrL7rXY4o','2026-05-18 22:17:55.694296','2026-05-25 22:17:55.000000',2,'1454664f2adb45cb984059d376519aea'),(124,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ4MCwiaWF0IjoxNzc5MTQyNjgwLCJqdGkiOiI3YjM2NWZjMGM5NmI0NTBkYmM5ZDAwNjcwODY2ZTg5YiIsInVzZXJfaWQiOiIzIn0.SLHvWXjH81cVaLrVatxBzLrzXypF5dFPSXTm9xAvZI4','2026-05-18 22:18:00.541475','2026-05-25 22:18:00.000000',3,'7b365fc0c96b450dbc9d00670866e89b'),(125,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ4MiwiaWF0IjoxNzc5MTQyNjgyLCJqdGkiOiIyMGMyYjM2NjFhODY0MjdlYjA0YjVhMzA4NDBkODhjYiIsInVzZXJfaWQiOiIyIn0.SR_zXCRKVPJOKpRUxa3ZPrvgyL4cXS52c7m8DsvNwJ8','2026-05-18 22:18:02.438395','2026-05-25 22:18:02.000000',2,'20c2b3661a86427eb04b5a30840d88cb'),(126,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzQ4NCwiaWF0IjoxNzc5MTQyNjg0LCJqdGkiOiJjZGIyMjIzYjQ2MjA0NjQwYWY5NjdiNTliMGE5OGU5ZSIsInVzZXJfaWQiOiIxNSJ9.S31WlY8GeA9d0P0AMCoMLTQhIceX3y4NS1ekMz2vi1U','2026-05-18 22:18:04.074780','2026-05-25 22:18:04.000000',15,'cdb2223b46204640af967b59b0a98e9e'),(127,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0MCwiaWF0IjoxNzc5MTQyODQwLCJqdGkiOiJjNDQ2NDI1YmE0NTM0MzIzODE1MWQxMzRjYmIyYTJiMSIsInVzZXJfaWQiOiIzIn0.ehGXL1i-CrCYDOnkb9SNmzlzXL3adZXs88gOZvoJfB4','2026-05-18 22:20:40.930699','2026-05-25 22:20:40.000000',3,'c446425ba45343238151d134cbb2a2b1'),(128,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0MCwiaWF0IjoxNzc5MTQyODQwLCJqdGkiOiI3NjVkYmEwMDNiZmQ0MjQ3ODJhNjA5ZWMwNTQ2MzZlZCIsInVzZXJfaWQiOiIyIn0.4342DMrD7P81MZ2SVlj3sAhEqMxoQVr4L-nzw4arYSw','2026-05-18 22:20:40.933993','2026-05-25 22:20:40.000000',2,'765dba003bfd424782a609ec054636ed'),(129,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0MCwiaWF0IjoxNzc5MTQyODQwLCJqdGkiOiJkMzFiNjA3NGQ4YjQ0YzE3YTBiNTc5NDYzYTI4MDU3OSIsInVzZXJfaWQiOiIxNSJ9.aR3VNdfAnnhFtMWBU2JBrUlN3wNEqJgZMkEihVHsIlI','2026-05-18 22:20:40.962995','2026-05-25 22:20:40.000000',15,'d31b6074d8b44c17a0b579463a280579'),(130,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0MSwiaWF0IjoxNzc5MTQyODQxLCJqdGkiOiIyYzIxOTAwNzA4Mjc0MjkxYWE0YTI2M2FhNmQzODU3YiIsInVzZXJfaWQiOiIyIn0.hTw_aKSuEO5q5vGPgeKIFwf3vqbkpw-9Ba1-ymkfocY','2026-05-18 22:20:41.117314','2026-05-25 22:20:41.000000',2,'2c21900708274291aa4a263aa6d3857b'),(131,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0NiwiaWF0IjoxNzc5MTQyODQ2LCJqdGkiOiJlOTdhNDk1YTkwODk0N2ZmYjY1Y2Y2NmM0MzRlNjk0NSIsInVzZXJfaWQiOiIzIn0.f453Jio6haDFFEicWG0qU9hxXJYiHTjD7YCBy8hsdXY','2026-05-18 22:20:46.649678','2026-05-25 22:20:46.000000',3,'e97a495a908947ffb65cf66c434e6945'),(132,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0NiwiaWF0IjoxNzc5MTQyODQ2LCJqdGkiOiJmYWEzMWUyOWIwNmQ0M2FhYWRlNzZhNDViYjc2MGQyMCIsInVzZXJfaWQiOiIyIn0.6COnm6Gl_r1e1EuF00fqJ3Yn_SKAgVqbXKAHVyzGxIw','2026-05-18 22:20:46.776208','2026-05-25 22:20:46.000000',2,'faa31e29b06d43aaade76a45bb760d20'),(133,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY0NywiaWF0IjoxNzc5MTQyODQ3LCJqdGkiOiI0NmYwZTg3ZjcxNmY0ODg4OWE3NTVhMmRmYzZkZjQ1ZCIsInVzZXJfaWQiOiIxNSJ9.FBLx5t47deXJWntrTDKy-98JwphLABXst4imLWTFI1M','2026-05-18 22:20:47.616843','2026-05-25 22:20:47.000000',15,'46f0e87f716f48889a755a2dfc6df45d'),(134,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY1MiwiaWF0IjoxNzc5MTQyODUyLCJqdGkiOiI2MjA5MjhjNWI4M2M0MDQ1OTlhZTQ3OGVkYTAzODMxOCIsInVzZXJfaWQiOiIyIn0.j4ODRaT7wLpCWcc0WY71l5SwNSlFVlyLJyFcSDQN3qE','2026-05-18 22:20:52.054463','2026-05-25 22:20:52.000000',2,'620928c5b83c404599ae478eda038318'),(135,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY1MiwiaWF0IjoxNzc5MTQyODUyLCJqdGkiOiJmOGZjYjE1MGE1MzE0ZjRkYmZkYjgzZDc4NjY1NDExNSIsInVzZXJfaWQiOiIxNSJ9.bhoj7q_4HXQdQbP-a3PKjCYN59eI3Qe-YdbxUOHlWXw','2026-05-18 22:20:52.669611','2026-05-25 22:20:52.000000',15,'f8fcb150a5314f4dbfdb83d786654115'),(136,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY1NSwiaWF0IjoxNzc5MTQyODU1LCJqdGkiOiJmZGRlZmZkNmJiNjQ0NmMzOGQxNTg2ZGE0ZTRiNDIxMiIsInVzZXJfaWQiOiIzIn0.OURrfS1J6xkHq-ZHMFSWwTtimsBrXnb1Yaw25xkXku4','2026-05-18 22:20:55.166259','2026-05-25 22:20:55.000000',3,'fddeffd6bb6446c38d1586da4e4b4212'),(137,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY1NywiaWF0IjoxNzc5MTQyODU3LCJqdGkiOiIyY2E0ZjQ2Mzg3MTQ0YTM4YTYwMjI3NWNlZmNiMjA4MSIsInVzZXJfaWQiOiIxNSJ9.be6L6TwrXDC063b8eK5Lx2atSg2a277vvF95Xl1dFrs','2026-05-18 22:20:57.388235','2026-05-25 22:20:57.000000',15,'2ca4f46387144a38a602275cefcb2081'),(138,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY2MCwiaWF0IjoxNzc5MTQyODYwLCJqdGkiOiJlY2M0ZDhjMTY3M2E0ODFiYmZhOTA4MDAxODYzZWMxYyIsInVzZXJfaWQiOiIyIn0.1_GdJaLAY1qzZFkk8YJm3qWC7dB8bf2tyvrAmbXNOmM','2026-05-18 22:21:00.617215','2026-05-25 22:21:00.000000',2,'ecc4d8c1673a481bbfa908001863ec1c'),(139,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY2MCwiaWF0IjoxNzc5MTQyODYwLCJqdGkiOiI0NTE5ZTNjMzE1ZDE0NzFkOGNmZDNjMDI1NzA1ZTg1NiIsInVzZXJfaWQiOiIzIn0.snhOxuyTcbCt3l1o7s7hOUttnWoXXO8GiK7x9VIhpkE','2026-05-18 22:21:00.787451','2026-05-25 22:21:00.000000',3,'4519e3c315d1471d8cfd3c025705e856'),(140,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY2MiwiaWF0IjoxNzc5MTQyODYyLCJqdGkiOiJlNWNjMWRkODMxOGY0ZTUyYmRjMjYyYWZiMDg1MWJmOSIsInVzZXJfaWQiOiIxNSJ9.cRAnMB1VZC-f6d6OzH9fh8oqO5YKqmziumZbLl1iBnY','2026-05-18 22:21:02.660492','2026-05-25 22:21:02.000000',15,'e5cc1dd8318f4e52bdc262afb0851bf9'),(141,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY2NSwiaWF0IjoxNzc5MTQyODY1LCJqdGkiOiI4NDYxZGYzM2MwNDU0ZDYzOTAzMmNjN2E2YTFiMjdlMSIsInVzZXJfaWQiOiIzIn0.qRpt49LIaEm3YGOMupSZcFKC2SBdWNaIcXwrP3QYg8k','2026-05-18 22:21:05.783648','2026-05-25 22:21:05.000000',3,'8461df33c0454d639032cc7a6a1b27e1'),(142,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY2NywiaWF0IjoxNzc5MTQyODY3LCJqdGkiOiJkYjYzNzQzYjc4NDA0MjllODdhNTgyZGEwNTU3MGNjMiIsInVzZXJfaWQiOiIyIn0.MeIHEvJFz8-QRfW63UadQr2oDLJ9Fts1UtwMuwl6reI','2026-05-18 22:21:07.194686','2026-05-25 22:21:07.000000',2,'db63743b7840429e87a582da05570cc2'),(143,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY3MiwiaWF0IjoxNzc5MTQyODcyLCJqdGkiOiI5OGYwZTc2ZDBiYzI0MTc2YmRhODE0Y2U3YmExOGE2OSIsInVzZXJfaWQiOiIzIn0.ci79iSBLErTpG4anuVLPSMgw_8G6uA9W5EIn8MnSjMc','2026-05-18 22:21:12.736389','2026-05-25 22:21:12.000000',3,'98f0e76d0bc24176bda814ce7ba18a69'),(144,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY3MywiaWF0IjoxNzc5MTQyODczLCJqdGkiOiI0ZDg3ZTM1NTg5ODk0MzVkOGFiMTdiY2NiNzljYzFlZiIsInVzZXJfaWQiOiIyIn0.6LWMK_4fAtf2ZdkgMLAL4Xmfwv7kxRn1nLoHVh8tdhI','2026-05-18 22:21:13.874142','2026-05-25 22:21:13.000000',2,'4d87e3558989435d8ab17bccb79cc1ef'),(145,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY3OSwiaWF0IjoxNzc5MTQyODc5LCJqdGkiOiJlMzllMTU5NTE1YjY0ODUxOTZjYWE3ZDFmMWQzNjYzMSIsInVzZXJfaWQiOiIxNSJ9.QOzlzrqUTn8DAWnAzGQ55YKdcjZefwIXh-Y3PaN9c40','2026-05-18 22:21:19.185308','2026-05-25 22:21:19.000000',15,'e39e159515b6485196caa7d1f1d36631'),(146,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY4MCwiaWF0IjoxNzc5MTQyODgwLCJqdGkiOiJlMGRjYTRjMTBjMmY0ZGQwOWNkYmRkYzRhYzI1MmQ3MyIsInVzZXJfaWQiOiIzIn0.k34Pxs2K5yi99xCPy_v-6pT77CK_yHbV8LSOttq9ftc','2026-05-18 22:21:20.483372','2026-05-25 22:21:20.000000',3,'e0dca4c10c2f4dd09cdbddc4ac252d73'),(147,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0NzY4MCwiaWF0IjoxNzc5MTQyODgwLCJqdGkiOiI1ZGYxNDJmZGRhODg0N2E0OGFkMGZkNWUzNzVhY2NlNyIsInVzZXJfaWQiOiIyIn0.G_h8eQXtNe7n0b0-u_BDymOmRdA6nIMCJjlWiuy67pg','2026-05-18 22:21:20.682794','2026-05-25 22:21:20.000000',2,'5df142fdda8847a48ad0fd5e375acce7'),(148,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0Nzg3NSwiaWF0IjoxNzc5MTQzMDc1LCJqdGkiOiIzZDBmMDM3YWM4OTE0MDQ2OTQ3YWE5OTEzOWNhMTcwMyIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.bIn4oj6jstUFTt4ChDAooZm6PuBv1SSaNGGAe2QoOHc','2026-05-18 22:24:35.121584','2026-05-25 22:24:35.000000',2,'3d0f037ac8914046947aa99139ca1703'),(149,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODE5OCwiaWF0IjoxNzc5MTQzMzk4LCJqdGkiOiI4YjAxNGRmNWQzZjY0NTBmOTIwNTQ3NTk0YjY1MjcyNyIsInVzZXJfaWQiOiIxNSJ9.Uy7VHymwIqxvQPUJCTqmLDxh3dBVQwF82Xpn8_wgynA','2026-05-18 22:29:58.022053','2026-05-25 22:29:58.000000',15,'8b014df5d3f6450f920547594b652727'),(150,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4NCwiaWF0IjoxNzc5MTQzNTg0LCJqdGkiOiI0YWU2MGMyNzE3NTI0NmE3ODViNGEwZDQ2MzJlMjU4MyIsInVzZXJfaWQiOiIxNSJ9._SReyQyF81hrFCLfmiHPenTWZXats_AxBFYEWWn4Pno','2026-05-18 22:33:04.327609','2026-05-25 22:33:04.000000',15,'4ae60c27175246a785b4a0d4632e2583'),(151,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4NCwiaWF0IjoxNzc5MTQzNTg0LCJqdGkiOiI4Yjk2NmRjNmEzMWU0ZGE2YmU3ODcxMDVjNzBhZDMxYiIsInVzZXJfaWQiOiIzIn0.AnzFHpkvyekYUBHEqmJo758hIkTonv7CbHd4uVFxdgc','2026-05-18 22:33:04.424388','2026-05-25 22:33:04.000000',3,'8b966dc6a31e4da6be787105c70ad31b'),(152,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4NCwiaWF0IjoxNzc5MTQzNTg0LCJqdGkiOiJjM2RmZmZlNGZhNDc0N2RlYmQ5NWQyYWJkMTUyYWI2ZiIsInVzZXJfaWQiOiIyIn0.n8M3h4-sHZ5C306fW_cS4soQBvZ674jRn1m2knq9qMw','2026-05-18 22:33:04.482718','2026-05-25 22:33:04.000000',2,'c3dfffe4fa4747debd95d2abd152ab6f'),(153,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4NCwiaWF0IjoxNzc5MTQzNTg0LCJqdGkiOiJiYzFhZmQzYTJjZjE0NTNjOTNhNmQ2OWE1MjI3NGZiNCIsInVzZXJfaWQiOiIyIn0.2-3FmbNJFft3SBYknOUB7HBAf0EHslZ5gS5_yL4E5CU','2026-05-18 22:33:04.497359','2026-05-25 22:33:04.000000',2,'bc1afd3a2cf1453c93a6d69a52274fb4'),(154,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4OCwiaWF0IjoxNzc5MTQzNTg4LCJqdGkiOiJhNWFkMjEwNWNlNWE0ZmM4OGU4ZTdhYWRiNWU4OWJkNyIsInVzZXJfaWQiOiIzIn0.fAdYbUPgrc4PQkJ2b2p-CJaRhkcgLXyoZay0xtzHMUU','2026-05-18 22:33:08.392163','2026-05-25 22:33:08.000000',3,'a5ad2105ce5a4fc88e8e7aadb5e89bd7'),(155,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4OSwiaWF0IjoxNzc5MTQzNTg5LCJqdGkiOiIwMDY5ZjczMDk2NmI0NzNhOGUwMTk4YjUyYjk5YjdkOCIsInVzZXJfaWQiOiIyIn0.2c5ygvclqT4c4tXUpkg_OHA7f9XQh1VdbBIPOHCyVjk','2026-05-18 22:33:09.008225','2026-05-25 22:33:09.000000',2,'0069f730966b473a8e0198b52b99b7d8'),(156,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM4OSwiaWF0IjoxNzc5MTQzNTg5LCJqdGkiOiI1Mjk5MDQzYjAxMGE0M2NiOTllM2U0N2UzMGZiOWQzZiIsInVzZXJfaWQiOiIxNSJ9.RgAO6ihZnV8mBZcWvg2zaRtul50AeHsAmz4cw2vsH2g','2026-05-18 22:33:09.359554','2026-05-25 22:33:09.000000',15,'5299043b010a43cb99e3e47e30fb9d3f'),(157,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM5NCwiaWF0IjoxNzc5MTQzNTk0LCJqdGkiOiJiOTliNjc1NDg5Njc0YmQyYjVlOGJhYTk5Njk5MWEzOCIsInVzZXJfaWQiOiIyIn0.hN1p-JrcUp4Q6NmWNvEeIXbO0_aaom0TN4fub0ZNQWU','2026-05-18 22:33:14.459629','2026-05-25 22:33:14.000000',2,'b99b675489674bd2b5e8baa996991a38'),(158,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM5NSwiaWF0IjoxNzc5MTQzNTk1LCJqdGkiOiJjYzVhNTc0NTQ1MjM0N2M1OWQ1ZTM0NzRhNDVmZDI0NCIsInVzZXJfaWQiOiIxNSJ9.weCADLWX50u-3rdOGYKMK-_aRMUxQO5-zCN-P_ilACg','2026-05-18 22:33:15.319848','2026-05-25 22:33:15.000000',15,'cc5a5745452347c59d5e3474a45fd244'),(159,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODM5NiwiaWF0IjoxNzc5MTQzNTk2LCJqdGkiOiJmMDAxM2JjZTg1NWM0Mjc3YmE2YWZjMDQyZWZkZDM1MCIsInVzZXJfaWQiOiIzIn0.cJOX9MQ6bSPzbw7g71iTeWsUiNR43UlkFxLogDIaBXg','2026-05-18 22:33:16.583325','2026-05-25 22:33:16.000000',3,'f0013bce855c4277ba6afc042efdd350'),(160,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwMCwiaWF0IjoxNzc5MTQzNjAwLCJqdGkiOiI4OTViOWEwMzFjZmU0M2FkODE0OWE3M2NhOGRjYTIwMiIsInVzZXJfaWQiOiIxNSJ9.h8kI7_K_DKNgMAqf3E45ZhC4nGyptRRUOft21ROL5aA','2026-05-18 22:33:20.012186','2026-05-25 22:33:20.000000',15,'895b9a031cfe43ad8149a73ca8dca202'),(161,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwMSwiaWF0IjoxNzc5MTQzNjAxLCJqdGkiOiIxOTNiNjg3MzA1YWM0ZDhkYWUyNzBjMTYyYmI5MTk2YiIsInVzZXJfaWQiOiIzIn0.d6UpwE-DF1gp54NZnTRZih24H6Da0Hh2xEno8LQTa_M','2026-05-18 22:33:21.459200','2026-05-25 22:33:21.000000',3,'193b687305ac4d8dae270c162bb9196b'),(162,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwMSwiaWF0IjoxNzc5MTQzNjAxLCJqdGkiOiIyNzlmMmU2N2I1NDY0N2YxOTNhMDU4YTZhMzRkNTNmMyIsInVzZXJfaWQiOiIyIn0.olwvrWn3upoEMHUQ249P4ar2BbKPI8U_nBEAX0tst6c','2026-05-18 22:33:21.571050','2026-05-25 22:33:21.000000',2,'279f2e67b54647f193a058a6a34d53f3'),(163,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwNCwiaWF0IjoxNzc5MTQzNjA0LCJqdGkiOiI0OWM5ZDUzYzUzY2I0NmNhOGNkMjc2YmE0ODkzYTBmYSIsInVzZXJfaWQiOiIxNSJ9.pT9u5NFaB4cZcpw5y7wHlaiF_BJRL12Q9dxcaimZkAA','2026-05-18 22:33:24.528242','2026-05-25 22:33:24.000000',15,'49c9d53c53cb46ca8cd276ba4893a0fa'),(164,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwNSwiaWF0IjoxNzc5MTQzNjA1LCJqdGkiOiJmY2Q4ZDFmZTc1ZjE0YTgzYmExNjlmNDM0ODg5ZDgwNyIsInVzZXJfaWQiOiIzIn0.0-z9N-gs5y0UooWkWZlJiiwzIGx33EU1miBMUlkHIME','2026-05-18 22:33:25.577146','2026-05-25 22:33:25.000000',3,'fcd8d1fe75f14a83ba169f434889d807'),(165,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQwOCwiaWF0IjoxNzc5MTQzNjA4LCJqdGkiOiJhYzQ0M2NhZjFmYTk0Yzk2OTE4ZmFjMGNlYzZhOTM2ZCIsInVzZXJfaWQiOiIyIn0.Yt4nsLaEDmcL8DSL5TOtnxzCwMcrLZNeQqugAQ55NcM','2026-05-18 22:33:28.048644','2026-05-25 22:33:28.000000',2,'ac443caf1fa94c96918fac0cec6a936d'),(166,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQxMywiaWF0IjoxNzc5MTQzNjEzLCJqdGkiOiI4YmY0Y2E0OTRkYjE0OTMxOTE1YWNlMjJhYjAzZTg4YSIsInVzZXJfaWQiOiIzIn0.vokc4DhiSaOQJ-96VcGyxasDsT_PjTNXhnrpDORec8A','2026-05-18 22:33:33.026313','2026-05-25 22:33:33.000000',3,'8bf4ca494db14931915ace22ab03e88a'),(167,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQxMywiaWF0IjoxNzc5MTQzNjEzLCJqdGkiOiJkMjczNjY4MDk5MTU0ZGY5YmU0NmIwY2NkOTRhODliNSIsInVzZXJfaWQiOiIxNSJ9.Y02rx3ddoXSelWmMqEPuCC45hGrAahM3rYLIHnc_LuA','2026-05-18 22:33:33.067951','2026-05-25 22:33:33.000000',15,'d273668099154df9be46b0ccd94a89b5'),(168,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQxNCwiaWF0IjoxNzc5MTQzNjE0LCJqdGkiOiIxYmUzM2QwZTNjY2I0YmQzYjIxNzdkNzMxOWFjNmYzZCIsInVzZXJfaWQiOiIyIn0.Pw6eSjTQi640-mpudvwVszd5F-5_Tvh_rXr6aB9HfJc','2026-05-18 22:33:34.515773','2026-05-25 22:33:34.000000',2,'1be33d0e3ccb4bd3b2177d7319ac6f3d'),(169,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQyMCwiaWF0IjoxNzc5MTQzNjIwLCJqdGkiOiJjMzU3MDI3Njc5NWM0MmJiYmRlODlkODZiMWM3YTJlNCIsInVzZXJfaWQiOiIzIn0.1cNwfLeRVwYYqCWo9XmE4aUK928mpD1Hts8JELQ1SMw','2026-05-18 22:33:40.114655','2026-05-25 22:33:40.000000',3,'c3570276795c42bbbde89d86b1c7a2e4'),(170,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODQyMCwiaWF0IjoxNzc5MTQzNjIwLCJqdGkiOiI0MDg3ZTQzMmE1ZmQ0MjZiOGUzM2ZjN2M1YjE4Yjg5ZCIsInVzZXJfaWQiOiIyIn0.Ixf4ngbQthBcjuLc0wE_3i7gJ6tOZMqmJl20yf-jD04','2026-05-18 22:33:40.738404','2026-05-25 22:33:40.000000',2,'4087e432a5fd426b8e33fc7c5b18b89d'),(171,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg1NiwiaWF0IjoxNzc5MTQ0MDU2LCJqdGkiOiI4ZTY4YmRmZmMyYmU0ZTI3YTllNDM0MWM1MmM2NzNlZiIsInVzZXJfaWQiOiIyIn0.ui6NQU0a58tyXX6Uf9nPPso6pCDdZqeRZhkHfmfY6ZM','2026-05-18 22:40:56.249507','2026-05-25 22:40:56.000000',2,'8e68bdffc2be4e27a9e4341c52c673ef'),(172,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg1NiwiaWF0IjoxNzc5MTQ0MDU2LCJqdGkiOiIwNGQyZGJlNTBhOWY0N2M4OGVhMDgzN2ZmNWE5NGE3NCIsInVzZXJfaWQiOiIxNSJ9.pf2HHCZTANlC8sngytlZbjnoPcaFc-rSuJHs4rEVJnM','2026-05-18 22:40:56.521649','2026-05-25 22:40:56.000000',15,'04d2dbe50a9f47c88ea0837ff5a94a74'),(173,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg1NiwiaWF0IjoxNzc5MTQ0MDU2LCJqdGkiOiJlODFlYjQzMDIzYzE0N2VlODdjNzgxMTIwNGZmMGM5MCIsInVzZXJfaWQiOiIzIn0.6JsegohCYNdYUTNNBpQ_lMO1pWzuhNcv83EeYc4ii1w','2026-05-18 22:40:56.571087','2026-05-25 22:40:56.000000',3,'e81eb43023c147ee87c7811204ff0c90'),(174,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg1NiwiaWF0IjoxNzc5MTQ0MDU2LCJqdGkiOiI4OWRlNDNjYjEzNDU0YzVmOWYwYjkwMjJkY2JiMGU3NCIsInVzZXJfaWQiOiIyIn0.UiHDQsAZ2ZE-t54lz3lIg7loL-j8CcJjc-yOb6XUkYw','2026-05-18 22:40:56.575981','2026-05-25 22:40:56.000000',2,'89de43cb13454c5f9f0b9022dcbb0e74'),(175,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2MSwiaWF0IjoxNzc5MTQ0MDYxLCJqdGkiOiI1ZGUxYzU0YzliZjE0MDU4OTQ4MWMzMjc5Zjc4OWM4YiIsInVzZXJfaWQiOiIzIn0.p2ZviP8Za1NjH6EHATzVv8Dycf0fYzYNB9hwG1N2ATg','2026-05-18 22:41:01.362701','2026-05-25 22:41:01.000000',3,'5de1c54c9bf140589481c3279f789c8b'),(176,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2MSwiaWF0IjoxNzc5MTQ0MDYxLCJqdGkiOiI1MDdiOWU3NWViMjk0MzkwODFkZTM1ZGMzNzNiNDQwZCIsInVzZXJfaWQiOiIyIn0.op93CKXbMqu4gQwr61aJBjUE_wXkY69h_95H8QqHkZ0','2026-05-18 22:41:01.721864','2026-05-25 22:41:01.000000',2,'507b9e75eb29439081de35dc373b440d'),(177,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2MiwiaWF0IjoxNzc5MTQ0MDYyLCJqdGkiOiJhOWE3MTI1ZWNlMDA0MmQzYmQyMDc3NzYzYWFlMDQ2MyIsInVzZXJfaWQiOiIxNSJ9.VAU-6wqHTu7Ij8X867viw-9VpHdpYXkfTVappEKGjV0','2026-05-18 22:41:02.851065','2026-05-25 22:41:02.000000',15,'a9a7125ece0042d3bd2077763aae0463'),(178,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2MywiaWF0IjoxNzc5MTQ0MDYzLCJqdGkiOiJjMzNjNmE4YTUyYzE0YjI1OGYzMDhhOGU5YjczMzdmYyIsInVzZXJfaWQiOiIyIn0.fTRcONo0fLwaEAWVxLnEqxr4wR3_YM1LLk2mfY1NNzg','2026-05-18 22:41:03.055577','2026-05-25 22:41:03.000000',2,'c33c6a8a52c14b258f308a8e9b7337fc'),(179,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2NiwiaWF0IjoxNzc5MTQ0MDY2LCJqdGkiOiI2MGI1NDIzYzQwNmY0M2Y5ODAxZjZkMTM2ZDBlNWNiNSIsInVzZXJfaWQiOiIyIn0.QpbrID8n2_46yZ6PbieDg1sHpJYCTy2r_yI5z04VFOs','2026-05-18 22:41:06.432773','2026-05-25 22:41:06.000000',2,'60b5423c406f43f9801f6d136d0e5cb5'),(180,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2OCwiaWF0IjoxNzc5MTQ0MDY4LCJqdGkiOiJjYTEzOTg1NjU3ZGQ0NzljYTEzZDBlNmQ0ZjI3OTg5NiIsInVzZXJfaWQiOiIxNSJ9.pjjCwd1Xl5ASt420nNb02ahYZAZfYkP1LedchbB6-oA','2026-05-18 22:41:08.041924','2026-05-25 22:41:08.000000',15,'ca13985657dd479ca13d0e6d4f279896'),(181,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2OSwiaWF0IjoxNzc5MTQ0MDY5LCJqdGkiOiI4NGNlYjMyNTUwNDU0MTY4YjVjMzVkMmM2ODgyNDg1NiIsInVzZXJfaWQiOiIyIn0.sxKYT0wL2VqwWVuNNcySZBBas3K0lk9WhBFhuiOwqvg','2026-05-18 22:41:09.695051','2026-05-25 22:41:09.000000',2,'84ceb32550454168b5c35d2c68824856'),(182,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg2OSwiaWF0IjoxNzc5MTQ0MDY5LCJqdGkiOiJjYWRkZTgyNzc3NjM0NWVhYTVjYjU3N2NmMjgxMTcyOCIsInVzZXJfaWQiOiIzIn0.-Fzs3Q5FD9H05bsRf3hEZqh2IvR_bS_J5AY5k8UdRJY','2026-05-18 22:41:09.756136','2026-05-25 22:41:09.000000',3,'cadde827776345eaa5cb577cf2811728'),(183,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg3MiwiaWF0IjoxNzc5MTQ0MDcyLCJqdGkiOiJiMjQxYzk4NWNlNGI0NDAxOWZmNzIyZmU1ZDZkZWNkOSIsInVzZXJfaWQiOiIxNSJ9.Hvuh5881riZBaBr3STNr9SeWhpbKyVfiKS-E8fnDGAM','2026-05-18 22:41:12.717684','2026-05-25 22:41:12.000000',15,'b241c985ce4b44019ff722fe5d6decd9'),(184,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg3MywiaWF0IjoxNzc5MTQ0MDczLCJqdGkiOiJjYmI1YWY3MTk3YzA0ZWFjOGY0ZjE4MmIwZmQ1MGMwNCIsInVzZXJfaWQiOiIyIn0.nRc-WQo94EBise2wu51ncYvPsu1PNSUUXUDaaRmmBB8','2026-05-18 22:41:13.507990','2026-05-25 22:41:13.000000',2,'cbb5af7197c04eac8f4f182b0fd50c04'),(185,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg3NCwiaWF0IjoxNzc5MTQ0MDc0LCJqdGkiOiIxYjNkNWJlYTFhNDg0MWVhODliNjY5YWZmMGIyMTYxMyIsInVzZXJfaWQiOiIzIn0._Psyf5Z8z4SbSR4kZ6tO44neFXrmEz5MndD_1TtI430','2026-05-18 22:41:14.801657','2026-05-25 22:41:14.000000',3,'1b3d5bea1a4841ea89b669aff0b21613'),(186,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg3NiwiaWF0IjoxNzc5MTQ0MDc2LCJqdGkiOiJkNTA0MGEzNjdkNTI0YTg3OWU3NDA3ZjdkYmVlYWMzYyIsInVzZXJfaWQiOiIyIn0.814Wa69SJYfah1bKK1RZcJmzheAcIO2GO2YcuepjeK0','2026-05-18 22:41:16.730558','2026-05-25 22:41:16.000000',2,'d5040a367d524a879e7407f7dbeeac3c'),(187,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg3NywiaWF0IjoxNzc5MTQ0MDc3LCJqdGkiOiI2NjA5ZTgyNTc2Nzc0YzJjYTk5ZDRkN2YwOTNkMTJlZCIsInVzZXJfaWQiOiIxNSJ9.uOe5xP8fTmIJ2dxqoAwk4bR5cOVV3vpFOpEZvkC-bzM','2026-05-18 22:41:17.574998','2026-05-25 22:41:17.000000',15,'6609e82576774c2ca99d4d7f093d12ed'),(188,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4MCwiaWF0IjoxNzc5MTQ0MDgwLCJqdGkiOiJhMzAxNTU0MzJkYjc0ZmQ0YWIyZTMxNzU3OGViZjgwOSIsInVzZXJfaWQiOiIzIn0.eoHINlwmknI9diJDKht7_EkATh_uEuQebebHjwP4x9I','2026-05-18 22:41:20.036035','2026-05-25 22:41:20.000000',3,'a30155432db74fd4ab2e317578ebf809'),(189,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4MCwiaWF0IjoxNzc5MTQ0MDgwLCJqdGkiOiJkNjk0ZWZjMTkyZjE0ZGU2OGE2Mjc5YjViOTBhMTY5ZiIsInVzZXJfaWQiOiIyIn0._979ZWvS246NgCzdvVwViB3wd6otQBwIeyZK5E7vDUo','2026-05-18 22:41:20.850603','2026-05-25 22:41:20.000000',2,'d694efc192f14de68a6279b5b90a169f'),(190,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4MiwiaWF0IjoxNzc5MTQ0MDgyLCJqdGkiOiI2NWUxMTk0NTgzZTQ0YzEwODg0ZjIyNTYzNDdmMjgyMCIsInVzZXJfaWQiOiIyIn0.ZNRhp58bMxKGkArvrAZeNahELwS9e7wLb39HS2YGxY8','2026-05-18 22:41:22.710838','2026-05-25 22:41:22.000000',2,'65e1194583e44c10884f2256347f2820'),(191,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4NiwiaWF0IjoxNzc5MTQ0MDg2LCJqdGkiOiI3OTY4OTA4NWI1NzA0MDExYTE3NjVjNDA0YzkzYWRhOSIsInVzZXJfaWQiOiIxNSJ9.ecqp7xZNTFTYuf8ZKOh4YaIMCHJEnSiXeThLDPZaRQ4','2026-05-18 22:41:26.440881','2026-05-25 22:41:26.000000',15,'79689085b5704011a1765c404c93ada9'),(192,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4NywiaWF0IjoxNzc5MTQ0MDg3LCJqdGkiOiIxZWY3ZDQ5YTYwOGQ0MjQwYmVmOGVhNjVjYWFmMThiYiIsInVzZXJfaWQiOiIyIn0.9ydW65hkW51fkEkJXTVgQVSvBNvG471tOnYctjd7Vto','2026-05-18 22:41:27.171125','2026-05-25 22:41:27.000000',2,'1ef7d49a608d4240bef8ea65caaf18bb'),(193,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4NywiaWF0IjoxNzc5MTQ0MDg3LCJqdGkiOiI4M2Q3NGM1ODJmMzY0MGE5YmU1ZjIxZWM1ZDE0NTAxMyIsInVzZXJfaWQiOiIzIn0.bqFayTjeFsXKJDGdSIExuw6MOzO1y0OOxz1eoZ9-R90','2026-05-18 22:41:27.659167','2026-05-25 22:41:27.000000',3,'83d74c582f3640a9be5f21ec5d145013'),(194,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg4NywiaWF0IjoxNzc5MTQ0MDg3LCJqdGkiOiIxNGNkOWU2ZjZkMTQ0NTRiYTdlODhiZDgxZmU4ZmE2ZSIsInVzZXJfaWQiOiIyIn0.u2Y9dCenrdVHO6Bhp1-xW5exuctuSfVc47HIJM1pbH0','2026-05-18 22:41:27.717292','2026-05-25 22:41:27.000000',2,'14cd9e6f6d14454ba7e88bd81fe8fa6e'),(195,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg5NCwiaWF0IjoxNzc5MTQ0MDk0LCJqdGkiOiI3MTRlOWMxZDczMDk0NDQ0YTkwM2MyZTY0ZjNkYmVkZCIsInVzZXJfaWQiOiIyIn0.JBJ0QMmkFpMyiSlE4arJHElgNVOhrjP9kRu_0gGCYho','2026-05-18 22:41:34.320031','2026-05-25 22:41:34.000000',2,'714e9c1d73094444a903c2e64f3dbedd'),(196,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg5NSwiaWF0IjoxNzc5MTQ0MDk1LCJqdGkiOiJiYjZkYTkwMzZhODc0ODVhYTViZDQ4ZjllMjJiODVjNiIsInVzZXJfaWQiOiIzIn0.rPJuQGBbNvgffLc9YWPu6GX6_9im-qAESrcevTt6H4I','2026-05-18 22:41:35.479620','2026-05-25 22:41:35.000000',3,'bb6da9036a87485aa5bd48f9e22b85c6'),(197,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODg5NSwiaWF0IjoxNzc5MTQ0MDk1LCJqdGkiOiI3NjNjYWQ5M2Q1YmQ0MTk5YThlZDgyODIzMDE2ZDg1NSIsInVzZXJfaWQiOiIyIn0.g56PvIcYMFw0pXIm4aZigRBv-HU59r_qbhJYdGKfzik','2026-05-18 22:41:35.969008','2026-05-25 22:41:35.000000',2,'763cad93d5bd4199a8ed82823016d855'),(198,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc0ODkwNSwiaWF0IjoxNzc5MTQ0MTA1LCJqdGkiOiJkMThkNWM4ZDY1YWU0OGVhOWE2NmJiNjZhNGY0NmZhOCIsInVzZXJfaWQiOiIyIn0.4BeOOgn5_aI23hcOP6ABfz-GAjheNepDrfHqOL3bAHA','2026-05-18 22:41:45.652960','2026-05-25 22:41:45.000000',2,'d18d5c8d65ae48ea9a66bb66a4f46fa8'),(199,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc1MDE1MSwiaWF0IjoxNzc5MTQ1MzUxLCJqdGkiOiJkYTBlMWFjMjcxOTg0OGMzOTUyM2UzMTU1ODkzNTRkZSIsInVzZXJfaWQiOiIxNCJ9.89SF7qHZopLMfJ_GTEkLuMs5JcgIJa0gqJJwj-L0vak','2026-05-18 23:02:31.986939','2026-05-25 23:02:31.000000',14,'da0e1ac2719848c39523e315589354de'),(200,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc1MDE1NSwiaWF0IjoxNzc5MTQ1MzU1LCJqdGkiOiJkNjkyN2U1ZjIwZTQ0NTZkOWEzOGFmZDUwYjc1OTg5ZCIsInVzZXJfaWQiOiIzIiwicm9sZSI6InJoIiwibXVzdF9jaGFuZ2VfcGFzc3dvcmQiOmZhbHNlLCJtZWRfdHlwZSI6bnVsbCwibm9tX2FyIjpudWxsLCJwcmVub21fYXIiOm51bGwsInNpdGVfaWQiOjEsInNpdGVfbm9tIjoiTGVvbmkgTWVuemVsIEhheWV0Iiwic2l0ZV90ZW1wbGF0ZV9rZXkiOiJNT05BU1RJUiIsInNpdGVfY29kZSI6Ik1FTlpFTF9IQVlFVCIsInVzZXJuYW1lIjoiQWxpIE5hamphciJ9.CB0_JFyx7jISIs8HrQy_cSPrdr4Bt7GzijvAiagqx7Q','2026-05-18 23:02:35.115849','2026-05-25 23:02:35.000000',3,'d6927e5f20e4456d9a38afd50b75989d'),(201,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTc1MDE2MiwiaWF0IjoxNzc5MTQ1MzYyLCJqdGkiOiI2ZDI1YmJiODIzOTU0MmIzYWZjNDMzMmJhMGM0MDdiZiIsInVzZXJfaWQiOiI2In0.li2lEnx9HOzpm-yd2TTL37PAQLUe3aO-8vKCe9AykTc','2026-05-18 23:02:42.373599','2026-05-25 23:02:42.000000',6,'6d25bbb8239542b3afc4332ba0c407bf'),(202,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNDYwMSwiaWF0IjoxNzc5MTk5ODAxLCJqdGkiOiI5YzQxZjlkYTA2ZWI0YzZiOTBjMmU5MTg5YWJiYzViOCIsInVzZXJfaWQiOiIyIiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IlNhZmEgTmFqamFyIn0.KOhYXvzlayBUKYUoL42gyK0nnNIPQ7JhMMGbfhM3H-Q','2026-05-19 14:10:01.044237','2026-05-26 14:10:01.000000',2,'9c41f9da06eb4c6b90c2e9189abbc5b8'),(203,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNDY3MCwiaWF0IjoxNzc5MTk5ODcwLCJqdGkiOiI1MjE5YzFmMDZhYWE0ZGE0YTQyY2M3NjM1OTM4NDViMyIsInVzZXJfaWQiOiIyIn0.mRnB6cuog0vttaYfEX4Jq7MHaeSYUrOTBo7Fg8icOMY','2026-05-19 14:11:10.681724','2026-05-26 14:11:10.000000',2,'5219c1f06aaa4da4a42cc763593845b3'),(204,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNDkxOSwiaWF0IjoxNzc5MjAwMTE5LCJqdGkiOiIzMzIzZDNjODA4NTY0ZDBmYTJhMDMxYzUyZWRmMDY0YSIsInVzZXJfaWQiOiIyIn0.u1eKKJvYCzgVrBl3gZPZpsvgQBoYq4nkWbQ-4MZjGdo','2026-05-19 14:15:19.922395','2026-05-26 14:15:19.000000',2,'3323d3c808564d0fa2a031c52edf064a'),(205,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTE0NSwiaWF0IjoxNzc5MjAwMzQ1LCJqdGkiOiI5NzUzODQ1NzcxNWU0MzI4OGMyYjk1MDYzZjc2ZDY4ZSIsInVzZXJfaWQiOiI2Iiwicm9sZSI6Im1lZGVjaW4iLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsIm1lZF90eXBlIjoidHJhdmFpbCIsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjoxLCJzaXRlX25vbSI6Ikxlb25pIE1lbnplbCBIYXlldCIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTU9OQVNUSVIiLCJzaXRlX2NvZGUiOiJNRU5aRUxfSEFZRVQiLCJ1c2VybmFtZSI6IkZhdGVuIE5hamphciJ9.9leO8ANe0mEY18vkIsMN6bmkkWzolNlu4RvH7MTy5NI','2026-05-19 14:19:05.138584','2026-05-26 14:19:05.000000',6,'97538457715e43288c2b95063f76d68e'),(206,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTE1NSwiaWF0IjoxNzc5MjAwMzU1LCJqdGkiOiI4ZjI0Yjc0NzJlYWM0MmIxYWFiYWQzNzk1NmM3YTM0ZCIsInVzZXJfaWQiOiIxMCJ9.mIS4T9ctskSJr2PzMHZBWQkoSorxBVQhQmQC4-b6RFM','2026-05-19 14:19:15.464102','2026-05-26 14:19:15.000000',10,'8f24b7472eac42b1aabad37956c7a34d'),(207,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTI3NiwiaWF0IjoxNzc5MjAwNDc2LCJqdGkiOiJhMzJkYWU2MmJjYmY0OGY2YTE2NTcxMzAwZjA1MzM3MSIsInVzZXJfaWQiOiIzIiwicm9sZSI6InJoIiwibXVzdF9jaGFuZ2VfcGFzc3dvcmQiOmZhbHNlLCJtZWRfdHlwZSI6bnVsbCwibm9tX2FyIjpudWxsLCJwcmVub21fYXIiOm51bGwsInNpdGVfaWQiOjEsInNpdGVfbm9tIjoiTGVvbmkgTWVuemVsIEhheWV0Iiwic2l0ZV90ZW1wbGF0ZV9rZXkiOiJNT05BU1RJUiIsInNpdGVfY29kZSI6Ik1FTlpFTF9IQVlFVCIsInVzZXJuYW1lIjoiQWxpIE5hamphciJ9.3VjTMYA0pgHh2w9r6NiJPh-XvRw-5_w2q9OXH4Z4MKE','2026-05-19 14:21:16.856213','2026-05-26 14:21:16.000000',3,'a32dae62bcbf48f6a16571300f053371'),(208,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTI5MCwiaWF0IjoxNzc5MjAwNDkwLCJqdGkiOiJjMTE5ZjllOTE4ZGQ0NzQxYjdhNzYwYzM4MTdmMWFhZCIsInVzZXJfaWQiOiI4In0.M1WRHXs70M7uO6RnkLJsVc8I_g6i9S693hilVO22R0A','2026-05-19 14:21:30.594154','2026-05-26 14:21:30.000000',8,'c119f9e918dd4741b7a760c3817f1aad'),(209,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTMyMSwiaWF0IjoxNzc5MjAwNTIxLCJqdGkiOiI5ODNjYzkwMjNiMDg0YjU5YTRlNzQ0NmM0YjRjMDllMCIsInVzZXJfaWQiOiI1In0.dmkYOcUNvdtJTDMJ6ZlYti2teFUj38EzyFGmTbZexQI','2026-05-19 14:22:01.445926','2026-05-26 14:22:01.000000',5,'983cc9023b084b59a4e7446c4b4c09e0'),(210,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTM2OSwiaWF0IjoxNzc5MjAwNTY5LCJqdGkiOiJjMDU2YWJmZmRiY2Q0YzA1YWM1ZjRiZWVlZjIxZDk5ZiIsInVzZXJfaWQiOiIyIn0.mm8gYgfIhsPxWcIEY1mvpX78pJot9xBb49gktxCcBtk','2026-05-19 14:22:49.880949','2026-05-26 14:22:49.000000',2,'c056abffdbcd4c05ac5f4beeef21d99f'),(211,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNTM5MiwiaWF0IjoxNzc5MjAwNTkyLCJqdGkiOiI5ZGZmNTk0YWMyNTE0OWQxODM0NzI1NmQ5ZjQ3OGZhMCIsInVzZXJfaWQiOiI2In0.TCUXPZPySB9rvyzQFHqGVmLn9Xgv_0SPLrY4D6zDxSc','2026-05-19 14:23:12.206324','2026-05-26 14:23:12.000000',6,'9dff594ac25149d18347256d9f478fa0'),(212,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgwNjMxOCwiaWF0IjoxNzc5MjAxNTE4LCJqdGkiOiJlZTUwMzg5NmM1NzU0NDdhYTVkMGNjZDE0NjljYzYyYiIsInVzZXJfaWQiOiI4In0.Awi3F2qjn7voZQhCXA1403Z-nfieVTikmQbBcsMmTR4','2026-05-19 14:38:38.631475','2026-05-26 14:38:38.000000',8,'ee503896c575447aa5d0ccd1469cc62b'),(213,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgxOTQ2MiwiaWF0IjoxNzc5MjE0NjYyLCJqdGkiOiJiMTcxOTMxMDFmZTg0NWI2YjA0MGFlZTYzMzk1YmRjYiIsInVzZXJfaWQiOiI4Iiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjozLCJzaXRlX25vbSI6Ikxlb25pIE1hdGV1ciIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTUFURVVSIiwic2l0ZV9jb2RlIjoiTUFURVVSIiwidXNlcm5hbWUiOiJNYXJpZW0gQmVuIGpvbWFhIn0.-jUYOV5PcZAq9UT33FCGh55xCzPG5JF-J46_cgqlHZc','2026-05-19 18:17:42.988900','2026-05-26 18:17:42.000000',8,'b17193101fe845b6b040aee63395bdcb'),(214,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgxOTQ2MywiaWF0IjoxNzc5MjE0NjYzLCJqdGkiOiJhZWE1MjZiNDU3NzI0YzRmODAwODY2Zjk4MTQwNGI1MCIsInVzZXJfaWQiOiI4Iiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjozLCJzaXRlX25vbSI6Ikxlb25pIE1hdGV1ciIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTUFURVVSIiwic2l0ZV9jb2RlIjoiTUFURVVSIiwidXNlcm5hbWUiOiJNYXJpZW0gQmVuIGpvbWFhIn0.3_M1aZUf5PuHo1AEvaF5tebHbK0n6q55N4v9BBFyqD0','2026-05-19 18:17:43.882263','2026-05-26 18:17:43.000000',8,'aea526b457724c4f800866f981404b50'),(215,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTgyNjcwOSwiaWF0IjoxNzc5MjIxOTA5LCJqdGkiOiI2ZjQ1ZmRjMGE1ZmY0ZjA1YWUxYzRmNGY0NzkzMjc1YSIsInVzZXJfaWQiOiI4Iiwicm9sZSI6ImluZmlybWllciIsIm11c3RfY2hhbmdlX3Bhc3N3b3JkIjpmYWxzZSwibWVkX3R5cGUiOm51bGwsIm5vbV9hciI6bnVsbCwicHJlbm9tX2FyIjpudWxsLCJzaXRlX2lkIjozLCJzaXRlX25vbSI6Ikxlb25pIE1hdGV1ciIsInNpdGVfdGVtcGxhdGVfa2V5IjoiTUFURVVSIiwic2l0ZV9jb2RlIjoiTUFURVVSIiwidXNlcm5hbWUiOiJNYXJpZW0gQmVuIGpvbWFhIn0.84RzVLWltFhtnIXL4RqFGX8TJ9N-Rey23zzrIdS3ymI','2026-05-19 20:18:29.640458','2026-05-26 20:18:29.000000',8,'6f45fdc0a5ff4f05ae1c4f4f4793275a');
/*!40000 ALTER TABLE `token_blacklist_outstandingtoken` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-22 12:38:48
