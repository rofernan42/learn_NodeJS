const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const prodElem = btn.closest('article');
    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            console.log(data);
            prodElem.parentNode.removeChild(prodElem);
        })
        .catch();
};