from datetime import datetime, timezone, timedelta


def parse_datetime(value):
    """Parse a datetime value that may be a string or datetime object, ensuring UTC timezone."""
    if isinstance(value, str):
        dt = datetime.fromisoformat(value)
    else:
        dt = value
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def calculate_streak(relapses, user_created_at, now):
    """Calculate current streak days since last relapse or account creation."""
    if relapses:
        last_relapse = parse_datetime(relapses[0]["created_at"])
        return (now - last_relapse).days
    created = parse_datetime(user_created_at)
    return (now - created).days


def calculate_period_data(urges, now, days_back):
    """Calculate urge data for a given number of days back."""
    result = []
    for i in range(days_back):
        day = now - timedelta(days=(days_back - 1) - i)
        day_str = day.strftime("%Y-%m-%d")
        day_urges = [u for u in urges if u["created_at"][:10] == day_str]
        day_resisted = len([u for u in day_urges if u.get("outcome") == "resisted"])
        entry = {"date": day_str, "urges": len(day_urges), "resisted": day_resisted}
        if days_back <= 7:
            entry["label"] = day.strftime("%a")
        result.append(entry)
    return result


def calculate_yearly_data(urges, now):
    """Calculate urge data for the last 12 months, grouped by month."""
    result = []
    for i in range(11, -1, -1):
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        month_str = f"{year}-{month:02d}"
        month_urges = [u for u in urges if u["created_at"][:7] == month_str]
        month_resisted = len([u for u in month_urges if u.get("outcome") == "resisted"])
        label = datetime(year, month, 1).strftime("%b")
        result.append({"date": month_str, "label": label, "urges": len(month_urges), "resisted": month_resisted})
    return result


def calculate_best_streak(relapses, current_streak):
    """Calculate the best streak ever across all relapse gaps."""
    all_relapse_dates = sorted([r["created_at"] for r in relapses])
    best = current_streak
    if len(all_relapse_dates) > 1:
        for i in range(1, len(all_relapse_dates)):
            d1 = parse_datetime(all_relapse_dates[i - 1])
            d2 = parse_datetime(all_relapse_dates[i])
            gap = (d2 - d1).days
            if gap > best:
                best = gap
    return best
