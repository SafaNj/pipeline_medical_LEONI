"""
Codes site pour la colonne im_db.resource.site et pour Site.code (medical_db).

Les valeurs canoniques sont les seules autorisées en écriture vers im_db.
Les entrées invalides ou historiques sont rejetées à la normalisation (chaîne vide).
"""

from __future__ import annotations

# Référence métier : isolation des données entre sites dans im_db.resource.site
IM_SITE_CODES = frozenset(
    {
        "MENZEL_HAYET",
        "MASSADINE",
        "MATEUR",
    }
)

# Alias saisis par erreur ou anciennes données → code canonique
_IM_SITE_ALIASES = {
    "MESSADINE": "MASSADINE",
    "MASSEDINE": "MASSADINE",
}


def normalize_im_site_code(raw) -> str:
    """
    Retourne un code IM canonique ou '' si inconnu / vide.

    Accepte variantes de casse et espaces ; pas de correspondance floue hors alias définis.
    """
    if raw is None:
        return ""
    s = str(raw).strip().upper().replace(" ", "_")
    if not s:
        return ""
    s = _IM_SITE_ALIASES.get(s, s)
    return s if s in IM_SITE_CODES else ""
