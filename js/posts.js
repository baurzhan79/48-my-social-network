"use strict";

$(() => {
    const userName = $("#userName");

    const user_1 = {
        email: "baurzhan_yussupov@gmail.com",
        profile: ""
    }
    const user_2 = {
        email: "baurzhan.yussupov@gmail.com",
        profile: ""
    }

    const user_3 = {
        email: "baurzhangulnur@gmail.com",
        profile: ""
    }

    const currentUser = user_3;
    const BASE_URL = `http://146.185.154.90:8000/blog/${currentUser.email}`;

    const getUserName = async (user) => {
        const setUrl = `${BASE_URL}/profile`
        const response = await fetch(setUrl);
        const profile = await response.json();
        user.profile = profile;
        userName.text(`${user.profile.firstName} ${user.profile.lastName}`);
    }

    getUserName(currentUser);

    // ===================================================
    const showPosts = (posts) => {
        const divPosts = $("#posts");
        divPosts.html("");

        let postCount = 0;
        posts.forEach(post => {
            const postDate = moment(post.datetime).format('DD.MM.YYYY, HH:mm:ss');

            postCount++;
            if (postCount <= 20) {
                const newPostHtml = `<div class="m-3 border">
                                        <h5 class="post_title m-2 text-secondary">${post.user.firstName} ${post.user.lastName} said (${postDate})</h5>
                                        <h4 class="post_subtitle m-2">${post.message}</h4>
                                    </div>`;
                divPosts.append(newPostHtml);
            }
        })
    }

    const getPosts = async (user) => {
        const setUrl = `${BASE_URL}/posts`
        const response = await fetch(setUrl);
        const posts = await response.json();

        posts.sort(function (a, b) {
            const dateA = new Date(a.datetime);
            const dateB = new Date(b.datetime);
            return dateB - dateA; //сортировка по убывающей дате
        })

        showPosts(posts);
    }

    getPosts(currentUser);

    let timerId = setInterval(() => {
        getPosts(currentUser);
    }, 5000);


    // ===================================================
    const requestSend = (url, message) => {
        return new Promise(async (resolve, reject) => {
            let response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: message
            });

            if (response.ok) { // если HTTP-статус в диапазоне 200-299
                let json = await response.json();
                // console.log("json", json);
                resolve(json);

            } else {
                // console.log("Ошибка HTTP:", response.status);
                reject(response);
            }

        });
    };

    const saveProfile = (firstName, lastName, modalPage) => {
        const setUrl = `${BASE_URL}/profile`;
        const message = "firstName=" + encodeURIComponent(firstName) + "&lastName=" + encodeURIComponent(lastName);

        let errorMessage = "";
        requestSend(setUrl, message) // запрос возвращает Promise
            .then(data => {
                if (data.error !== undefined) {
                    errorMessage = data.error;
                    alert(errorMessage);
                }
                else {
                    modalPage.remove();
                    getUserName(currentUser);
                }
            })
            .catch(error => {
                errorMessage = `Something went wrong. Status: ${error.status} "${error.statusText}"`;
                alert(errorMessage);
            });
    }

    $("#btnEdit").on("click", () => {
        const modalHtml = `<div class="modal" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                <div class="modal-dialog">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h1 class="modal-title fs-5" id="staticBackdropLabel">Edit profile</h1>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            <form>
                                                <div class="form-group mb-4">
                                                    <label for="firstName" class="col-form-label">First name:</label>
                                                    <input type="text" class="form-control" id="firstName"  value="${currentUser.profile.firstName}">
                                                </div>
                                                <div class="form-group">
                                                    <label for="lastName" class="col-form-label">Last name:</label>
                                                    <input type="text" class="form-control" id="lastName" value="${currentUser.profile.lastName}">
                                                </div>
                                            </form>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Save changes</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

        const modalPage = $(modalHtml);

        $("body").append(modalPage);

        modalPage.css("display", "block");

        const btnModalClose = modalPage.find('div.modal-header button[data-bs-dismiss="modal"]');
        btnModalClose.on("click", () => {
            modalPage.remove();
        });

        const btnModalSaveChanges = modalPage.find('div.modal-footer button[data-bs-dismiss="modal"]');
        btnModalSaveChanges.on("click", () => {
            const inputFirstName = modalPage.find("input#firstName").val();
            const inputLastName = modalPage.find("input#lastName").val();

            if (inputFirstName !== "" && inputLastName !== "") saveProfile(inputFirstName, inputLastName, modalPage);
            else alert("first name and last name must not be empty!");
        });
    })

    // ===================================================
    const checkSubscribeEmail = async (setUrl, email) => {
        const response = await fetch(setUrl);
        const subscribeUsers = await response.json();

        let result = false;
        subscribeUsers.forEach(user => {
            if (user.email === email) result = true;
        });

        return result;
    }

    const followUser = async (email, modalPage) => {
        const setUrl = `${BASE_URL}/subscribe`;

        const wasSubscribed = await checkSubscribeEmail(setUrl, email);
        if (wasSubscribed) {
            alert(`Email "${email}" already subscribed. No need to add`);
            return;
        }

        const message = "email=" + encodeURIComponent(email);

        let errorMessage = "";
        requestSend(setUrl, message) // запрос возвращает Promise
            .then(data => {
                if (data.error !== undefined) {
                    errorMessage = data.error;
                    alert(errorMessage);
                }
                else {
                    modalPage.remove();
                    getPosts(currentUser);
                }
            })
            .catch(error => {
                errorMessage = `Something went wrong. Status: ${error.status} "${error.statusText}"`;
                alert(errorMessage);
            });
    }

    $("#btnFollowUser").on("click", () => {
        const modalHtml = `<div class="modal" id="staticBackdrop" tabindex="-1">
                                <div class="modal-dialog modal-dialog-scrollable">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="staticBackdropLabel">Follow user</h5>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            <form>
                                                <div class="form-group">
                                                    <label for="email" class="col-form-label">E-mail:</label>
                                                    <input type="email" class="form-control" id="email">
                                                </div>
                                            </form>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

        const modalPage = $(modalHtml);

        $("body").append(modalPage);

        modalPage.css("display", "block");

        const btnModalClose = modalPage.find('div.modal-header button[data-bs-dismiss="modal"]');
        btnModalClose.on("click", () => {
            modalPage.remove();
        });

        const btnModalAddEmail = modalPage.find('div.modal-footer button[data-bs-dismiss="modal"]');
        btnModalAddEmail.on("click", () => {
            const inputEmail = modalPage.find("input#email").val();

            if (inputEmail !== "") followUser(inputEmail, modalPage);
            else alert("E-mail must not be empty!");
        });
    })

    // ===================================================
    const sendMessage = (inputMessage) => {
        const messageText = inputMessage.val();
        const setUrl = `${BASE_URL}/posts`;
        const message = "message=" + encodeURIComponent(messageText);

        let errorMessage = "";
        requestSend(setUrl, message) // запрос возвращает Promise
            .then(data => {
                if (data.error !== undefined) {
                    errorMessage = data.error;
                    alert(errorMessage);
                }
                else {
                    inputMessage.val("");
                    getPosts(currentUser);
                }
            })
            .catch(error => {
                errorMessage = `Something went wrong. Status: ${error.status} "${error.statusText}"`;
                alert(errorMessage);
            });
    }

    $("#btnSendMessage").on("click", () => {
        const inputMessage = $("#messageText");

        if (inputMessage.val() !== "") sendMessage(inputMessage);
        else alert("Message must not be empty!");
    })
})