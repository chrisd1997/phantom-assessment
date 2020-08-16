/** @type {Array<(String|null)>|null} We save the exiting bookmarks in a variable */
let existingUrls = JSON.parse(window.localStorage.getItem('bookmarks')) || [];

/** @type {Number|null} We also calculate the pages and store that in a variable */
let pages =
    existingUrls.length > 20
        ? Math.ceil(existingUrls.length / 20)
        : 1;

/**
 * Validate the field.
 * If the field has no errors
 * we validate the reset of the
 * form to make the submit button active
 *
 * @param {!HTMLInputElement} el
 */
const validateField = (el) => {
    /** @type {String} */
    const bookmarkId = el.getAttribute('data-edit-id');
    let selectedBookmark = null;

    if (bookmarkId !== '' && bookmarkId !== null) {
        selectedBookmark = existingUrls.filter((_, index) => index === parseInt(bookmarkId))[0];
    }

    if (!el.value.length) {
        setFieldError(el, 'This field cannot be empty');
    } else if (!validURL(el.value)) {
        setFieldError(el, 'Please provide a valid URL');
    } else if (
        !selectedBookmark &&
        existingUrls.includes(el.value) ||

        selectedBookmark &&
        el.value !== selectedBookmark &&
        existingUrls.includes(el.value)) {
        setFieldError(el, 'URL is already bookmarked');
    } else {
        setFieldError(el, null);
        validateForm(el);
    }
};

/**
 * Set the field's error or remove it
 *
 * @param {!HTMLInputElement} el
 * @param {?String} error
 */
const setFieldError = (el, error) => {
    /** @type {HTMLElement} */
    const errorField = el.parentNode.querySelector('.error-field');

    if (error && error.length) {
        el.classList.add('error');
        errorField.innerHTML = error
    } else {
        el.classList.remove('error');
        errorField.innerHTML = '';
    }
};

/**
 * Validate the complete form to make sure no fields have errors
 * Once validated, enable the submit button
 *
 * @param {!HTMLInputElement} el
 */
const validateForm = (el) => {
    const form = el.parentNode.parentNode;

    if (form.tagName.toLowerCase() === 'form') {
        /** @type {Boolean} */
        let valid = true;

        /** @type {HTMLButtonElement} */
        const submitButton = form.querySelector('button[type="submit"]');

        form.querySelectorAll('input').forEach((input) => {
            if (input.classList.contains('error')) valid = false;
        });

        submitButton.disabled = !valid;
    }
};

/**
 * Add the bookmark by storing the URL in
 * the localStorage
 *
 * @param e
 */
const addBookmark = (e) => {
    e.preventDefault();
    /** @type {HTMLInputElement} */
    const urlField = e.target.querySelector('input[type="url"]');
    /** @type {String} */
    const bookmarkId = urlField.getAttribute('data-edit-id');
    /** @type {Array<String>} */
    const newBookmarks = existingUrls;

    if (bookmarkId !== '' && bookmarkId !== null) {
        newBookmarks[parseInt(urlField.getAttribute('data-edit-id'))] = urlField.value;
    } else {
        newBookmarks.push(urlField.value);
    }

    storeBookmarks(newBookmarks);
    showThanksPage(urlField.value);
};

/**
 * Validate that the provided string is a URL
 *
 * @param {!String} str
 * @returns {boolean}
 */
const validURL = (str) => {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
};

/**
 * Reset the form back to its original state
 *
 * @param {!HTMLElement} urlField
 */
const resetForm = (urlField) => {
    urlField.removeAttribute('data-edit-id');
    document.getElementsByClassName('cancel-edit')[0].classList.remove('show');
    urlField.value = '';
    document.querySelector('button[type="submit"]').disabled = true;
};

/**
 * Edit a bookmark by its index.
 * Clicking on the pencil will
 * set the field in "edit mode"
 * and make it focused
 *
 * @param {!Number} index
 */
const editBookmark = (index) => {
    const bookmark = existingUrls.filter((_, i) => i === index)[0];

    if (bookmark) {
        const urlField = document.getElementById('url');
        urlField.value = bookmark;
        urlField.setAttribute('data-edit-id', index.toString());
        urlField.focus();
        document.getElementsByClassName('cancel-edit')[0].classList.add('show');
    }
};

/**
 * Remove a bookmark by its index
 * and rerender the bookmarks list
 * and pagination items
 *
 * @param {!Number} index
 */
const removeBookmark = (index) => {
    if (existingUrls.length) {
        if (confirm('Are you sure that you want to remove this bookmark?') === true) {
            storeBookmarks(existingUrls.filter((_, i) => i !== index));
            renderBookmarkList();
            renderPagination();
        }
    }
};

/**
 * Render the bookmarks into the table
 * We use pagination to make sure we
 * only show 20 items per page
 *
 */
const renderBookmarkList = () => {
    /** @type {HTMLElement} */
    const tableEl = document.getElementsByTagName('table')[0];
    tableEl.querySelector('tbody').innerHTML = '';

    if (existingUrls.length) {
        /** @type {URLSearchParams} */
        const urlParams = new URLSearchParams(window.location.search);
        /** @type {Number} */
        const currentPage = parseInt(urlParams.get('page')) || 1;
        /** @type {Number} */
        const pagination = currentPage * 20;

        existingUrls
            .slice(pagination === 20 ? 0 : (pagination - 20), pagination)
            .forEach((bookmark, index) => {
                /** @type {HTMLElement} */
                const row = document.createElement('tr');
                /** @type {HTMLElement} */
                const url = document.createElement('td');
                /** @type {HTMLElement} */
                const link = document.createElement('a');

                link.href = bookmark.toString();
                link.target = '_blank';
                link.appendChild(document.createTextNode(bookmark));
                url.appendChild(link);

                /** @type {HTMLElement} */
                const actions = document.createElement('td');
                actions.innerHTML =
                    '<button type="button" class="edit-button" data-id="' + index + '">' +
                    '<i class="fal fa-pencil-alt"></i>' +
                    '</button>' +
                    '<button type="button" class="delete-button" data-id="' + index + '">' +
                    '<i class="fal fa-trash-alt"></i>' +
                    '</button>';

                row.appendChild(url);
                row.appendChild(actions);

                document.getElementsByTagName('table')[0]
                    .querySelector('tbody')
                    .appendChild(row);
            });

        document.getElementById('counter')
            .innerText = 'Showing ' + (pagination - 20) + ' - ' + pagination;

        /** @type {HTMLElement} */
        const prevButton = document.getElementById('prevPage');
        /** @type {HTMLElement} */
        const nextButton = document.getElementById('nextPage');

        if (currentPage === 1) {
            prevButton.classList.add('disabled');
            prevButton.href = '#';
        }

        if (currentPage > 1 && pages > 1) {
            prevButton.classList.remove('disabled');
            prevButton.href = '?page=' + (currentPage - 1);
        }

        if (currentPage !== pages) {
            nextButton.classList.remove('disabled');
            nextButton.href = '?page=' + (currentPage + 1);
        } else {
            nextButton.classList.add('disabled');
            nextButton.href = '#';
        }
    } else {
        /** @type {HTMLElement} */
        const row = document.createElement('tr');

        /** @type {HTMLElement} */
        const textNode = document.createElement('td');
        textNode.appendChild(document.createTextNode('No bookmarks available. Go add some!'));

        /** @type {HTMLElement} */
        const emptyNode = document.createElement('td');

        row.appendChild(textNode);
        row.appendChild(emptyNode);

        tableEl.querySelector('tbody').appendChild(row);
    }
};

/**
 * Render the pagination items
 * by the amount of pages
 *
 */
const renderPagination = () => {
    if (existingUrls.length) {
        /** @type {Element} */
        const paginationWrapper = document.getElementsByClassName('pagination-items')[0];
        paginationWrapper.innerHTML = '';

        for (let x = 1; x <= pages; x++) {
            /** @type {HTMLElement} */
            const paginationItem = document.createElement('a');
            paginationItem.href = '?page=' + x;

            /** @type {Text} */
            const paginationText = document.createTextNode(x.toString());
            paginationItem.appendChild(paginationText);

            paginationWrapper.appendChild(paginationItem);
        }
    }
};

/**
 * Shows the thanks page and
 * adds the last added bookmark
 * in the thank you message
 *
 * @param {!String} bookmark
 */
const showThanksPage = (bookmark) => {
    /** @type {Element} */
    const homePage = document.getElementsByClassName('page-home')[0];
    /** @type {Element} */
    const thanksPage = document.getElementsByClassName('page-complete')[0];

    homePage.classList.remove('active');
    thanksPage.querySelector('#bookmark-submission')
        .innerText = `Your bookmark "${bookmark}" has been added successfully!`;
    thanksPage.classList.add('active');
};

/**
 * Store the bookmarks in the
 * localStorage and set the new
 * data in the existingUrls variable
 *
 * @param {!Array<String>} bookmarks
 */
const storeBookmarks = (bookmarks) => {
    window.localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    existingUrls = JSON.parse(window.localStorage.getItem('bookmarks')) || [];
    pages =
        existingUrls.length > 20
            ? Math.ceil(existingUrls.length / 20)
            : 1;
}

(() => {
    /** @type {HTMLElement} **/
    const urlField = document.getElementById('url');

    // Listen for the submit of the add-form
    document.getElementById('add-form').addEventListener('submit', addBookmark);

    // Listen for the blur and keyup events on the input field
    urlField.addEventListener('blur', (e) => validateField(e.target));
    urlField.addEventListener('keyup', (e) => validateField(e.target));

    // Render the pagination items
    renderPagination();

    // Render the bookmark list
    renderBookmarkList();

    // Listen for all click events to make sure we capture the dynamic elements
    document.addEventListener('click', (e) => {
        // Listen for the click on the edit action
        if (e.target && e.target.classList.contains('edit-button')) {
            editBookmark(parseInt(e.target.dataset.id));
        }
        // Listen for the click on the delete action
        else if (e.target && e.target.classList.contains('delete-button')) {
            removeBookmark(parseInt(e.target.dataset.id));
        }
        // Listen for the click on the cancel edit button
        else if (e.target && e.target.classList.contains('cancel-edit')) {
            resetForm(urlField);
        }
    });

})();