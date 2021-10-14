var favourites = document.getElementById('recent-list')
const endPointURL = 'https://vps-dd78ba21.vps.ovh.ca:8443'

function deleteProfile(id) {
    var profileRow = document.getElementById(id);
    profileRow.remove();

    return fetch(`${endPointURL}/users?id=` + id, {
        method: 'DELETE',
    })
    .then(res => res.text()) // or res.json()
    .then(res => console.log(res))
}

function favouriteWorkstation(id) {
    var faveItem = document.getElementById(id)
    if (!faveItem) {
        favourites.innerHTML += `<li class="recent-list-item" id="${id}">
                                    <a class="text-decoration-none" href="javascript:{}" onclick="selectWorkstationModal('${id}')">
                                        <i class="las la-laptop"></i>
                                        ${id}
                                    </a>
                                    <a class="float-right margin-right-2 text-decoration-none text-color-red" href="javascript:favouriteWorkstation('${id}')">
                                        <i class="las la-trash"></i>
                                    </a>
                                </li>`
    } else {
        faveItem.remove()
    }
    return fetch(`${endPointURL}/workstations/fave/` + id, {
        method: 'POST',
    })
}

function deleteWorkstation(workstationId) {
    var deleteItem = document.getElementById('entry-'+workstationId)
    fetch(`${endPointURL}/workstations/` + workstationId, {
        method: 'DELETE',
    }).then(deleteItem.remove())
}