from django.test import TestCase


class ControlVisitsSmokeTest(TestCase):
    def test_imports(self):
        from apps.control_visits.models import (
            ListeContreVisite,
            ContreVisite,
            ControleMedical,
        )
        self.assertIsNotNone(ListeContreVisite)
        self.assertIsNotNone(ContreVisite)
        self.assertIsNotNone(ControleMedical)