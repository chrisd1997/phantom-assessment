/** @type {Array<String>} We save the exiting bookmarks in a variable */
let existingUrls = JSON.parse(localStorage.getItem('bookmarks')) || [];

/** @type {Number} We also calculate the pages and store that in a variable */
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
    if (!el.value.length) {
        setFieldError(el, 'This field cannot be empty');
    } else if (!validURL(el.value)) {
        setFieldError(el, 'Please provide a valid URL');
    } else if (el.getAttribute('data-mode') !== 'edit' && existingUrls.includes(el.value)) {
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
        let valid = true;
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
    const urlField = e.target.querySelector('input[type="url"]');
    const newBookmarks = existingUrls;

    if (
        urlField.getAttribute('data-mode') === 'edit' &&
        urlField.getAttribute('data-edit-id') !== undefined) {
        newBookmarks[urlField.getAttribute('data-edit-id')] = urlField.value;
    } else {
        newBookmarks.push(urlField.value);
    }

    storeBookmarks(newBookmarks);
    showThanksPage();
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
        urlField.setAttribute('data-mode', 'edit');
        urlField.setAttribute('data-edit-id', index.toString());
        urlField.focus();
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
        storeBookmarks(existingUrls.filter((_, i) => i !== index));
        renderBookmarkList();
        renderPagination();
    }
};

/**
 * Render the bookmarks into the table
 * We use pagination to make sure we
 * only show 20 items per page
 *
 */
const renderBookmarkList = () => {
    const tableEl = document.getElementsByTagName('table')[0];
    tableEl.querySelector('tbody').innerHTML = '';

    if (existingUrls.length) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page')) || 1;
        const pagination = currentPage * 20;

        existingUrls
            .slice(pagination === 20 ? 0 : (pagination - 20), pagination)
            .forEach((bookmark, index) => {
                const row = document.createElement('tr');
                const url = document.createElement('td');
                const link = document.createElement('a');

                link.href = bookmark.toString();
                link.target = '_blank';
                link.appendChild(document.createTextNode(bookmark));
                url.appendChild(link);

                const actions = document.createElement('td');
                actions.innerHTML =
                    '<button type="button" onclick="editBookmark(' + index + ')">' +
                    '<i class="fal fa-pencil-alt"></i>' +
                    '</button>' +
                    '<button type="button" onclick="removeBookmark(' + index + ')">' +
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

        const prevButton = document.getElementById('prevPage');
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
        const row = document.createElement('tr');

        const textNode = document.createElement('td');
        textNode.appendChild(document.createTextNode('No bookmarks available. Go add some!'));
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
        const paginationWrapper = document.getElementsByClassName('pagination-items')[0];

        for (let x = 1; x <= pages; x++) {
            const paginationItem = document.createElement('a');
            paginationItem.href = '?page=' + x;

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
 */
const showThanksPage = () => {
    const homePage = document.getElementsByClassName('page-home')[0];
    const thanksPage = document.getElementsByClassName('page-complete')[0];

    homePage.classList.remove('active');
    thanksPage.querySelector('#bookmark-submission')
        .innerText = `Your bookmark "${existingUrls.slice(-1)}" has been added successfully!`;
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
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    existingUrls = JSON.parse(localStorage.getItem('bookmarks')) || [];
    pages =
        existingUrls.length > 20
            ? Math.ceil(existingUrls.length / 20)
            : 1;
}

(() => {

    // Listen for the submit of the add-form
    document.getElementById('add-form').addEventListener('submit', addBookmark);

    // Render the pagination items
    renderPagination();

    // Render the bookmark list
    renderBookmarkList();

})();