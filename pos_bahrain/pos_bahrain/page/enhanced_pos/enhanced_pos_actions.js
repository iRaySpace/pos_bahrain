function init_pos_actions(pos) {
    // `this` is the html element
    pos.on('.pos-pay', async function() {
        await _map_pos_to_frm(pos);
        pos.frm.savesubmit();
    });
}

async function _map_pos_to_frm(pos) {
    const frm = pos.frm;
    frm.set_value('customer', pos.customer);
    pos.cart_items.forEach((item) => {
        const child = frm.add_child('items', {
            item_code: item.item_code,
            rate: item.rate,
            qty: item.qty,
        });
    });
    await frm.call({
        doc: frm.doc,
        method: 'set_missing_values'
    });
}