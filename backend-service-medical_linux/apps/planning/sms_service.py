import logging
from datetime import datetime

import requests
from django.conf import settings

logger = logging.getLogger(__name__)
_LAST_SMS_ERROR = ''


def get_last_sms_error() -> str:
    return _LAST_SMS_ERROR


def _set_last_sms_error(message: str) -> None:
    global _LAST_SMS_ERROR
    _LAST_SMS_ERROR = message


def format_phone(telephone: str) -> str:
    if not telephone or not isinstance(telephone, str):
        return ''

    sanitized = telephone.strip().replace(' ', '').replace('-', '')
    if sanitized.startswith('+'):
        sanitized = sanitized[1:]

    if sanitized.startswith('00'):
        sanitized = sanitized[2:]

    if sanitized.startswith('216'):
        if not sanitized.isdigit() or len(sanitized) < 11:
            return ''
        return sanitized

    if sanitized.isdigit() and len(sanitized) == 8:
        return '216' + sanitized

    if sanitized.startswith('0'):
        # 0x23456789 -> 216x23456789
        return '216' + sanitized[1:]

    # if phone is not fully numeric or badly formatted, return empty for safe fail
    if not sanitized.isdigit():
        return ''

    return sanitized


def send_sms(
    telephone: str,
    message: str,
    item=None,
    ligne_cv=None,
    ligne_vp=None,
    candidat_embauche=None,
    ligne_ss=None,
) -> bool:
    """Envoie un SMS via l'API TunisieSMS.

    Renvoie True si la requête a réussi côté client. En cas d'erreur, on loggue
    et on retourne False (erreur silencieuse pour le flux métier).

    item: instance ItemPassage, si fournie on marque sms_envoye=True en cas de succès.
    ligne_cv: instance LigneContreVisite, si fournie on marque sms_jour_j_envoye=True.
    ligne_vp: instance LigneVisitePeriodique, si fournie on marque sms_jour_j_envoye=True.
    candidat_embauche: instance CandidatEmbauche, si fournie on marque sms_jour_j_envoye=True.
    ligne_ss: instance LigneSurveillanceSpeciale, si fournie on marque sms_jour_j_envoye=True.
    """
    if not telephone or not message:
        _set_last_sms_error('telephone_ou_message_manquant')
        logger.warning('SMS non envoyé : telephone ou message manquant')
        return False

    api_key = getattr(settings, 'TUNISIESMS_API_KEY', None)
    if not api_key:
        _set_last_sms_error('api_key_manquante')
        logger.warning('TUNISIESMS_API_KEY non configuré, SMS non envoyé')
        return False

    numero = format_phone(telephone)
    if not numero:
        _set_last_sms_error('numero_invalide')
        logger.warning('Format du numéro invalide %s', telephone)
        return False

    sender = getattr(settings, 'TUNISIESMS_SENDER', 'LEONI')
    now = datetime.now()
    date_str = now.strftime('%d/%m/%Y')
    time_str = now.strftime('%H:%M')

    url = getattr(settings, 'TUNISIESMS_API_URL', 'https://app.tunisiesms.tn/api/Api.aspx')
    params = {
        'fct': 'sms',
        'key': api_key,
        'mobile': numero,
        'sms': message,
        'sender': sender,
        'date': date_str,
        'heure': time_str,
    }

    try:
        logger.debug('Envoi SMS à %s via TunisieSMS API', numero)
        _set_last_sms_error('')
        response = requests.get(url, params=params, timeout=10)
        response_text = (response.text or '').strip()
        logger.debug('Réponse TunisieSMS: HTTP %s - %s', response.status_code, response_text)
        
        api_ok = (
            response_text.startswith('100')
            or '<status_code>200</status_code>' in response_text
            or '<status_msg>![CDATA[OK]]</status_msg>' in response_text
        )
        if response.status_code == 200 and api_ok:
            logger.info('✓ SMS envoyé à %s - réponse: %s', numero, response_text)
            if item is not None:
                try:
                    item.sms_envoye = True
                    item.save(update_fields=['sms_envoye'])
                except Exception:
                    logger.exception('Impossible de marquer sms_envoye pour item %s', item)
            if ligne_cv is not None:
                try:
                    ligne_cv.sms_jour_j_envoye = True
                    ligne_cv.save(update_fields=['sms_jour_j_envoye'])
                except Exception:
                    logger.exception(
                        'Impossible de marquer sms_jour_j_envoye pour ligne CV %s', ligne_cv
                    )
            if ligne_vp is not None:
                try:
                    ligne_vp.sms_jour_j_envoye = True
                    ligne_vp.save(update_fields=['sms_jour_j_envoye'])
                except Exception:
                    logger.exception(
                        'Impossible de marquer sms_jour_j_envoye pour ligne VP %s', ligne_vp
                    )
            if candidat_embauche is not None:
                try:
                    candidat_embauche.sms_jour_j_envoye = True
                    candidat_embauche.save(update_fields=['sms_jour_j_envoye'])
                except Exception:
                    logger.exception(
                        'Impossible de marquer sms_jour_j_envoye pour candidat embauche %s',
                        candidat_embauche,
                    )
            if ligne_ss is not None:
                try:
                    ligne_ss.sms_jour_j_envoye = True
                    ligne_ss.save(update_fields=['sms_jour_j_envoye'])
                except Exception:
                    logger.exception(
                        'Impossible de marquer sms_jour_j_envoye pour ligne SS %s', ligne_ss
                    )
            return True
        
        short_response = response_text[:160].replace('\n', ' ')
        _set_last_sms_error(f'gateway_http_{response.status_code}:{short_response}')
        logger.error(
            '✗ SMS TunisieSMS échoué à %s - HTTP %s - réponse: %s',
            numero,
            response.status_code,
            response_text,
        )
        return False
    except requests.exceptions.Timeout:
        _set_last_sms_error('gateway_timeout')
        logger.error('✗ Timeout SMS à %s (TunisieSMS API inaccessible)', numero)
        return False
    except requests.exceptions.ConnectionError as exc:
        _set_last_sms_error(f'gateway_connection_error:{exc}')
        logger.error('✗ Erreur connexion SMS à %s: %s', numero, exc)
        return False
    except Exception as exc:
        _set_last_sms_error(f'gateway_exception:{exc}')
        logger.exception('✗ Erreur critique SMS à %s: %s', numero, exc)
        return False
