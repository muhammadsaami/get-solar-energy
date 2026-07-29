import sqlite3
import requests

conn = sqlite3.connect('backend/customer_platform.db')
curs = conn.cursor()
curs.execute('SELECT id FROM customers')
ids = [r[0] for r in curs.fetchall()]
print('Found', len(ids), 'customers')

for cid in ids:
    res = requests.post(
        'http://127.0.0.1:8000/api/ai/analyze', 
        json={
            'monthly_units': 350, 
            'city': 'Lucknow', 
            'billing_period': 'JAN', 
            'per_unit_rate': 7, 
            'bill_amount': 2450, 
            'customer_id': cid
        }
    )
    if res.status_code != 200:
        print('FAILED for customer', cid, res.status_code, res.text)
    else:
        print('SUCCESS for customer', cid)
