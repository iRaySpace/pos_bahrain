frappe.provide('pos_bahrain.enhanced_pos');

/**
 * Page initializer
 */
frappe.pages['enhanced-pos'].on_page_load = async function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Enhanced POS',
		single_column: true
	});

	const { message: pos_settings } = await frappe.db.get_value('POS Settings', { name: 'POS Settings' }, 'is_online');
	if (pos_settings && pos_settings.use_pos_in_offline_mode && !cint(pos_settings.use_pos_in_offline_mode)) {
		wrapper.enhanced_pos = new pos_bahrain.enhanced_pos.PointOfSale(wrapper);
		window.cur_pos = wrapper.enhanced_pos;
	}
};

frappe.pages['enhanced-pos'].refresh = function(wrapper) {
	if (wrapper.enhanced_pos) {
		cur_frm = wrapper.enhanced_pos.frm;
	}
};

/**
 * [PointOfSale] provides POS functionality
 */
pos_bahrain.enhanced_pos.PointOfSale = class PointOfSale {
	constructor(wrapper) {
		this.wrapper = $(wrapper)
			.find('.layout-main-section')
			.append('<div id="app"></div>');
		this.page = wrapper.page;

		frappe.require(['assets/css/enhanced_pos.min.css'], () => {
			this.init();
		});
	}
	init() {
		this.wrapper
			.find('#app')
			.append(frappe.templates['enhanced_pos']);
	}
};
