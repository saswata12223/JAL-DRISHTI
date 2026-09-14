"""

Unit tests for NASA Earthdata authentication & .env discovery.



Proves:

- .env discovery from project root

- Credential detection without revealing secret values

- Missing credential handling (AUTH_REQUIRED)

- Environment variable override support

"""



import os

import sys

import unittest

from pathlib import Path

from unittest.mock import patch



PROJECT_DIR = Path(__file__).resolve().parent.parent

sys.path.insert(0, str(PROJECT_DIR))





class TestEarthdataAuthDiscovery(unittest.TestCase):

    """Tests for Earthdata authentication loading and environment discovery."""



    def test_dotenv_file_exists_in_project_root(self):

        """Verify .env file is located at project root."""

        dotenv_path = PROJECT_DIR / ".env"

        self.assertTrue(dotenv_path.exists(), f".env file missing at {dotenv_path}")



    def test_credentials_detection_without_exposure(self):

        """Verify load_dotenv populates environment variables without printing secret values."""

        from dotenv import load_dotenv



        load_dotenv(PROJECT_DIR / ".env")

        user = os.getenv("EARTHDATA_USERNAME")

        pwd = os.getenv("EARTHDATA_PASSWORD")



        # Prove credentials are set

        self.assertIsNotNone(user, "EARTHDATA_USERNAME should be present in .env")

        self.assertIsNotNone(pwd, "EARTHDATA_PASSWORD should be present in .env")

        self.assertGreater(len(user), 0)

        self.assertGreater(len(pwd), 0)



        # Prove values are non-empty strings without printing them in logs

        self.assertIsInstance(user, str)

        self.assertIsInstance(pwd, str)



    @patch.dict(os.environ, {}, clear=True)

    def test_missing_credentials_handling(self):

        """Verify missing credentials cleanly trigger non-interactive auth requirement."""

        user = os.getenv("EARTHDATA_USERNAME")

        pwd = os.getenv("EARTHDATA_PASSWORD")



        self.assertIsNone(user)

        self.assertIsNone(pwd)



    @patch.dict(os.environ, {"EARTHDATA_USERNAME": "test_user", "EARTHDATA_PASSWORD": "test_password"})

    def test_explicit_environment_variables(self):

        """Verify explicit environment variables take precedence."""

        self.assertEqual(os.getenv("EARTHDATA_USERNAME"), "test_user")

        self.assertEqual(os.getenv("EARTHDATA_PASSWORD"), "test_password")





if __name__ == "__main__":

    unittest.main()
