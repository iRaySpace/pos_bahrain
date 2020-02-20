function init_pos_actions(pos) {
    // `this` is the html element
    pos.on('.pos-pay', async function() {
        const payments = await pos.prompt_payment();
        await _map_pos_to_frm(pos, payments);
        pos.frm.savesubmit();
    });
}

async function _map_pos_to_frm(pos, payments) {
    const frm = pos.frm;
    frm.set_value('customer', pos.customer);

    // Set the cart items
    for (const item of pos.cart_items) {
        const child = frm.add_child('items', {
            item_code: item.item_code,
            rate: item.rate,
            qty: item.qty,
        });
    }

    // Set the payments
    // use `for const` for async await
    for (const payment of frm.doc.payments) {
        await frappe.model.set_value(
            'Sales Invoice Payment',
            payment.name,
            'amount',
            payments[payment.mode_of_payment],
        );
    }

    await frm.call({
        doc: frm.doc,
        method: 'set_missing_values'
    });
}