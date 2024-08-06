document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://read-hotmail.vercel.app/read_emails';
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
  const resultEl = document.getElementById('result');
  let isFetching = false;
  let counter = 0;
  let startTime = 0;

  credentialsInput.focus();
  credentialsInput.addEventListener('keyup', function(event) {
    if (event.keyCode === 13) {
      fetchButton.click();
    }
  });

  credentialsInput.addEventListener('paste', function(event) {
    setTimeout(() => {
      fetchButton.click();
    }, 100);
  });

  fetchButton.addEventListener('click', () => {
    counter = 0;
    startTime = performance.now();
    const credentials = credentialsInput.value.trim();
    if (!credentials) {
      console.log('Please enter your credentials');
      return;
    }

    const [usernamePart, password] = credentials.split('hotmail.com');
    if (!usernamePart || !password) {
      console.log('Please enter credentials in the format: email@hotmail.com password');
      return;
    }

    const email = `${usernamePart.trim()}hotmail.com`;
    const trimmedPassword = password.trim();

    if (isFetching) return; // Không thực hiện fetch nếu đang trong quá trình fetch

    isFetching = true;
    fetchButton.disabled = true;
    fetchButton.textContent = 'Fetching...';

    // Xóa danh sách email khi bắt đầu fetch
    resultEl.innerHTML = '';
    inboxList.innerHTML = '';
    junkList.innerHTML = '';

    fetchEmails(email, trimmedPassword);
  });

  const fetchEmails = (email, password) => {
    counter++;
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password: password }),
    })
        .then(response => {
          if (!response.ok) {
            if (response.status >= 500) {
              resultEl.innerHTML = `<li>Fetching error, trying again <span class="warning">${counter}</span> times ...</li>`;
              return fetchEmails(email, password);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return response.json();
        })
        .then(data => {
          displayEmail(data.inbox, inboxList);
          displayEmail(data.junk, junkList);

          let endTime = performance.now();
          let elapsedTime = (endTime - startTime) / 1000;
          resultEl.innerHTML = `<li>Success after ${counter} try. Process in ${Number(elapsedTime.toFixed(3))}s</li>`;
          isFetching = false;
          fetchButton.disabled = false;
          fetchButton.textContent = 'Fetch Emails';
        })
        .catch(error => {
          resultEl.innerHTML =
              `<li>
                Fetching error, check the console for detail: ${error.message}
                </br>Try again <span class="warning">${counter}</span> times ...
              </li>`;
          console.log('Error fetching emails: ' + error);
        })
        // .finally(() => {
        //   isFetching = false;
        //   fetchButton.disabled = false;
        //   fetchButton.textContent = 'Fetch Emails';
        // });
    }

  const displayEmail = (emails, emailEl) => {
    emailEl.innerHTML = '';
    if (!emails.length) {
      return emailEl.innerHTML = '<li>No emails found.</li>';
    }

    emails.forEach(email => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>Subject:</strong> ${email.Subject}<br /><strong>From:</strong> ${email.From}<br /><strong>Date:</strong> ${new Date(email.Date).toLocaleString()}`;
      li.addEventListener('click', () => openModal(email));

      if (email.Subject.includes('khóa')) {
        li.classList.add('blocked-account');
      }

      emailEl.appendChild(li);
    });
  }

  const openModal = (email) => {
    modalSubject.textContent = email.Subject;
    modalFrom.textContent = email.From;
    modalBody.innerHTML = email.Body.replace(/\n/g, '');  // Thay đổi để hiển thị body dạng HTML
    // modalBody.innerHTML = email.Body.replace(/\n/g, '<br />');  // Thay đổi để hiển thị body dạng HTML
    modal.style.display = 'flex';
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
