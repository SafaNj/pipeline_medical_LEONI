"""Utilitaires de dates pour la médecine du travail (VP, validité)."""

import calendar
from datetime import date


def add_calendar_months(source: date, months: int) -> date:
    """
    Ajoute ``months`` mois calendaires (conserve le jour si possible, sinon dernier jour du mois).

    Remplace l’ancienne approximation ``+ months * 30 jours`` pour l’échéance des visites
    périodiques (cohérence avec une validité « 12 mois » au sens civil).
    """
    if months <= 0:
        months = 12
    month_index = source.month - 1 + months
    year = source.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(source.day, last_day)
    return date(year, month, day)
