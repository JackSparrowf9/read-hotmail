from flask import Flask, request, jsonify, render_template
import imaplib
import email
from email import policy
from email.header import decode_header
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/read_emails', methods=['POST'])
def read_emails():
    data = request.get_json()
    username = data['username']
    password = data['password']

    # Kết nối tới server IMAP của Hotmail
    mail = imaplib.IMAP4_SSL("outlook.office365.com", 993)
    mail.login(username, password)

    def fetch_emails_from_folder(folder):
        mail.select(folder)
        status, response = mail.search(None, 'ALL')
        email_ids = response[0].split()

        emails = []
        for email_id in email_ids:
            status, data = mail.fetch(email_id, '(RFC822)')
            msg = email.message_from_bytes(data[0][1], policy=policy.default)

            subject, encoding = decode_header(msg['subject'])[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding if encoding else 'utf-8')

            sender = msg['from']
            body = ""

            if msg.is_multipart():
                for part in msg.iter_parts():
                    if part.get_content_type() == "text/plain":
                        body += part.get_payload(decode=True).decode()
            else:
                body = msg.get_payload(decode=True).decode()

            date = email.utils.parsedate_to_datetime(msg['date'])

            emails.append({
                "Subject": subject,
                "From": sender,
                "Body": body,
                "Date": date
            })

        # Sắp xếp email từ mới nhất đến cũ nhất
        emails.sort(key=lambda x: x['Date'], reverse=True)

        return emails

    inbox_emails = fetch_emails_from_folder("inbox")
    junk_emails = fetch_emails_from_folder("junk")

    return jsonify({
        "inbox": inbox_emails,
        "junk": junk_emails
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
