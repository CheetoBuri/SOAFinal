"""
Timezone utilities
"""
from datetime import datetime
import pytz

VIETNAM_TZ = pytz.timezone('Asia/Ho_Chi_Minh')


def get_vietnam_time():
    """Get current time in Vietnam timezone (UTC+7)"""
    return datetime.now(VIETNAM_TZ)
