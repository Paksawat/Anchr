#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HabitTrackerAPITester:
    def __init__(self, base_url="https://habit-reset-13.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()  # Use session to maintain cookies
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test registration with new user
        timestamp = int(datetime.now().timestamp())
        test_email = f"test.user.{timestamp}@example.com"
        test_password = "Test123456"
        test_name = "Test User"
        
        # Register new user
        register_data = self.run_test(
            "Register new user",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": test_password, "name": test_name}
        )
        
        if register_data:
            self.user_id = register_data.get('user_id')
            
        # Test /auth/me endpoint
        me_data = self.run_test(
            "Get current user (/auth/me)",
            "GET",
            "auth/me", 
            200
        )
        
        # Don't logout yet - we need the session for other tests
        return True

    def test_urge_endpoints(self):
        """Test urge tracking endpoints"""
        print("\n🔥 Testing Urge Endpoints...")
        
        # Create urge
        urge_data = self.run_test(
            "Create urge",
            "POST",
            "urges",
            200,
            data={
                "trigger": "Stress",
                "emotion": "Anxious", 
                "notes": "Test urge",
                "intensity": 7
            }
        )
        
        urge_id = None
        if urge_data:
            urge_id = urge_data.get('urge_id')
            
        # Get urges
        self.run_test(
            "Get urges list",
            "GET",
            "urges",
            200
        )
        
        # Update urge outcome
        if urge_id:
            self.run_test(
                "Update urge outcome",
                "PUT",
                f"urges/{urge_id}",
                200,
                data={
                    "outcome": "resisted",
                    "duration_seconds": 300,
                    "coping_used": "breathing"
                }
            )

    def test_stats_endpoints(self):
        """Test statistics endpoints"""
        print("\n📊 Testing Stats Endpoints...")
        
        # Get general stats
        self.run_test(
            "Get user stats",
            "GET",
            "stats",
            200
        )
        
        # Get trigger stats
        self.run_test(
            "Get trigger analytics",
            "GET", 
            "stats/triggers",
            200
        )

    def test_motivation_endpoints(self):
        """Test motivation endpoints"""
        print("\n💪 Testing Motivation Endpoints...")
        
        # Create motivation
        motivation_data = self.run_test(
            "Create motivation message",
            "POST",
            "motivations",
            200,
            data={
                "message": "I am stronger than my urges",
                "category": "self_love"
            }
        )
        
        motivation_id = None
        if motivation_data:
            motivation_id = motivation_data.get('motivation_id')
            
        # Get motivations
        self.run_test(
            "Get motivations list",
            "GET",
            "motivations", 
            200
        )
        
        # Delete motivation
        if motivation_id:
            self.run_test(
                "Delete motivation",
                "DELETE",
                f"motivations/{motivation_id}",
                200
            )

    def test_relapse_endpoints(self):
        """Test relapse tracking endpoints"""
        print("\n🔄 Testing Relapse Endpoints...")
        
        # Create relapse
        self.run_test(
            "Log relapse",
            "POST",
            "relapses",
            200,
            data={
                "trigger": "Boredom",
                "emotion": "Restless",
                "notes": "Test relapse entry"
            }
        )
        
        # Get relapses
        self.run_test(
            "Get relapses list",
            "GET",
            "relapses",
            200
        )

    def test_reminder_endpoints(self):
        """Test reminder settings endpoints"""
        print("\n⏰ Testing Reminder Endpoints...")
        
        # Get reminders
        self.run_test(
            "Get reminder settings",
            "GET",
            "reminders",
            200
        )
        
        # Update reminders
        self.run_test(
            "Update reminder settings",
            "PUT",
            "reminders",
            200,
            data={
                "enabled": True,
                "times": ["09:00", "21:00"],
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
            }
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting Habit Tracker API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Test auth first to get session
        auth_success = self.test_auth_flow()
        
        # Only continue with other tests if we have authentication
        if auth_success and self.user_id:
            self.test_urge_endpoints()
            self.test_stats_endpoints() 
            self.test_motivation_endpoints()
            self.test_relapse_endpoints()
            self.test_reminder_endpoints()
            
            # Test logout at the end
            print("\n🔐 Testing Logout...")
            self.run_test(
                "Logout",
                "POST",
                "auth/logout",
                200
            )
        else:
            print("❌ Authentication failed, skipping other tests")
            
        # Print summary
        print(f"\n📋 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return results for further analysis
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": self.tests_passed/self.tests_run*100 if self.tests_run > 0 else 0,
            "results": self.test_results
        }

def main():
    tester = HabitTrackerAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results["success_rate"] < 100:
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())