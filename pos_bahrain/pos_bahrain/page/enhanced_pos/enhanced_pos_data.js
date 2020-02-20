async function item_by_barcode_number(barcode_number) {
    const { message: item } = await frappe.call({
        method: 'pos_bahrain.api.item.search_serial_or_batch_or_barcode_number',
        args: { search_value: barcode_number }
    });
    return item;
}

async function get_pos_profile(company) {
    const { message: pos_profile } = await frappe.call({
        method: 'erpnext.stock.get_item_details.get_pos_profile',
        args: { company },
    });
    return pos_profile;
}
