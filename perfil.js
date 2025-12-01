import { auth } from './firebase.js';
import { updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const changeNameBtn = document.getElementById('changeNameBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const newDisplayName = document.getElementById('newDisplayName');

changeNameBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user && newDisplayName.value.trim() !== '') {
        updateProfile(user, { displayName: newDisplayName.value.trim() })
            .then(() => {
                location.reload();
            })
            .catch((error) => console.log(error));
    }
});

deleteAccountBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        if (confirm('¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) {
            deleteUser(user)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch((error) => console.log(error));
        }
    }
});
