function deleteProfile(id) {
    var profileRow = document.getElementById(id);
    profileRow.remove();

    return fetch('https://localhost:8443/users?id=' + id, {
        method: 'DELETE',
    })
    .then(res => res.text()) // or res.json()
    .then(res => console.log(res))
}