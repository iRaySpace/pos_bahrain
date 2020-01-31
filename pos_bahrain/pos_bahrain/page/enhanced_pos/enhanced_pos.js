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

		const customer_field = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link',
				label: 'Customer',
				fieldname: 'customer',
				options: 'Customer',
				reqd: 1,
				get_query: function() {
					return { query: 'erpnext.controllers.queries.customer_query' };
				}
			},
			parent: this.wrapper.find('.customer-field'),
			render_input: true
		});

		const item_detail_field = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Small Text',
				label: 'Item Details',
				fieldname: 'item_detail',
				read_only: true
			},
			parent: this.wrapper.find('.item-detail-field'),
			render_input: true
		});

		const item_field = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link',
				label: 'Item',
				fieldname: 'item',
				options: 'Item',
				onchange: function() {
					// const item = item_field.get_value();
					item_detail_field.set_value('Actual Qty: xxx\nPrice: xxx.xx');
				}
			},
			parent: this.wrapper.find('.item-field'),
			render_input: true
		});

		this.init_menu_items();
		this.init_action_items();
		// this.init_secondary_actions();
	}
	init_menu_items() {
		this.page.add_menu_item(__('Hold Invoice'), function() {
			console.log('hold');
		});
		this.page.add_menu_item(__('Pick Held Invoice'), function() {
			console.log('held');
		});
	}
	init_action_items() {
		this.page.add_action_item(__('Void Invoice'), function() {
			console.log('void');
		});
		this.page.add_action_item(__('Open Cash Drawer'), function() {
			console.log('void');
		});
	}
	// init_secondary_actions() {
	// 	this.page.set_secondary_action('Void Invoice', function() {
	// 		console.log('void invoice');
	// 	});
	// }
};
