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

function payment_dialog(mops) {
    const payment_fields = mops.map(function(mop) {
        return {
            fieldname: mop.mode_of_payment,
            fieldtype: 'Currency',
            label: mop.mode_of_payment,
            reqd: 1,
        };
    });
    return new Promise(function(resolve, reject) {
        const fields = [
            ...payment_fields
        ];
        const dialog = new frappe.ui.Dialog({
            title: __('Payment'),
            width: 800,
            fields,
        });
        dialog.set_primary_action(__('Submit'), function() {
            resolve(dialog.get_values());
            dialog.hide();
        });
        dialog.show();
    });
}
