document.addEventListener('DOMContentLoaded', () => {
  const fetchButton = document.getElementById('fetch-button');
  const credentialsInput = document.getElementById('credentials');
  const inboxList = document.getElementById('inbox-list');
  const junkList = document.getElementById('junk-list');
  const modal = document.getElementById('modal');
  const modalContent = document.querySelector('.modal-content');
  const modalSubject = document.getElementById('modal-subject');
  const modalFrom = document.getElementById('modal-from');
  const modalBody = document.getElementById('modal-body');
  const closeModal = document.querySelector('.close');
  let isFetching = false;

  fetchButton.addEventListener('click', () => {
    const credentials = credentialsInput.value.trim();
    if (!credentials) {
      alert('Please enter your credentials');
      return;
    }

    const [usernamePart, password] = credentials.split('hotmail.com');
    if (!usernamePart || !password) {
      alert('Please enter credentials in the format: email@hotmail.com password');
      return;
    }

    const email = `${usernamePart.trim()}hotmail.com`;
    const trimmedPassword = password.trim();

    if (isFetching) return; // Không thực hiện fetch nếu đang trong quá trình fetch

    isFetching = true;
    fetchButton.disabled = true;
    fetchButton.textContent = 'Fetching...';

    inboxList.innerHTML = ''; // Xóa danh sách email khi bắt đầu fetch
    junkList.innerHTML = '';

    fetchEmails(email, trimmedPassword);
  });

  const fetchEmails = (email, password) => {
    fetch('http://127.0.0.1:5000/read_emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password: password }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        inboxList.innerHTML = ''; // Xóa danh sách email khi nhận dữ liệu mới
        junkList.innerHTML = '';

        if (data.inbox.length === 0) {
          inboxList.innerHTML = '<li>No emails found in inbox.</li>';
        } else {
          data.inbox.forEach(email => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Subject:</strong> ${email.Subject}<br /><strong>From:</strong> ${email.From}<br /><strong>Date:</strong> ${new Date(email.Date).toLocaleString()}`;
            li.addEventListener('click', () => openModal(email));
            inboxList.appendChild(li);
          });
        }

        if (data.junk.length === 0) {
          junkList.innerHTML = '<li>No emails found in junk.</li>';
        } else {
          data.junk.forEach(email => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Subject:</strong> ${email.Subject}<br /><strong>From:</strong> ${email.From}<br /><strong>Date:</strong> ${new Date(email.Date).toLocaleString()}`;
            li.addEventListener('click', () => openModal(email));
            junkList.appendChild(li);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching emails:', error);
        alert('Error fetching emails. Please check console for details.');
      })
      .finally(() => {
        isFetching = false;
        fetchButton.disabled = false;
        fetchButton.textContent = 'Fetch Emails';
      });
  };

  const openModal = (email) => {
    modalSubject.textContent = email.Subject;
    modalFrom.textContent = email.From;
    modalBody.innerHTML = email.Body.replace(/\n/g, '<br />');  // Thay đổi để hiển thị body dạng HTML
    modal.style.display = 'block';
  };

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  modalContent.addEventListener('click', (event) => {
    event.stopPropagation();
  });
});
