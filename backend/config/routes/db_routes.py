from flask_restx import Namespace, Resource
from config.db import SupabaseClient

health_ns = Namespace('health', description='Health check')

@health_ns.route('/db')
class HealthCheck(Resource):
    def get(self):
        try:
            client = SupabaseClient().get_client()

            response = client.rpc("health_check").execute()

            return {
                "status": "ok",
                "data": response.data
            }, 200

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }, 500