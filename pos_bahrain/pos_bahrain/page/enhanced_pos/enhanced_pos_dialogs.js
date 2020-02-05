function prompt_change_qty() {
    return new Promise(function(resolve, reject) {
        const fields = [
            {
                'fieldname': 'qty',
                'fieldtype': 'Float',
                'label': 'Qty',
                'reqd': 1
            }
        ];
        frappe.prompt(
            fields,
            (values) => resolve(values),
            'Change Qty',
            'Submit'
        );
    });
}

function prompt_change_price() {
    return new Promise(function(resolve, reject) {
        const fields = [
            {
                'fieldname': 'rate',
                'fieldtype': 'Currency',
                'label': 'Rate',
                'reqd': 1
            }
        ];
        frappe.prompt(
            fields,
            (values) => resolve(values),
            'Change Price',
            'Submit'
        );
    });
}

function confirm_delete_item() {
    return new Promise(function(resolve, reject) {
        frappe.confirm(
            'Are you sure you want to delete this item?',
            () => resolve(true),
            () => resolve(false)
        );
    });
}
