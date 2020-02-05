{% include 'pos_bahrain/pos_bahrain/page/enhanced_pos/enhanced_pos_data.js' %}

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

        // Cart attributes
        this.cart_items = [];
        this.selected_cart_item = null;

		frappe.require(['assets/css/enhanced_pos.min.css'], () => {
			this.init();
		});
	}
	init() {
		this.wrapper
			.find('#app')
			.append(frappe.templates['enhanced_pos']);

		this.$pos_items__empty = this.wrapper.find('.pos-items__empty');
		this.$pos_items = this.wrapper.find('.pos-items');

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
				fieldtype: 'Data',
				label: 'Item',
				fieldname: 'item',
				onchange: async () => {
					const item = await item_by_barcode_number(item_field.get_value());
					item_detail_field.set_value('Actual Qty: 50\nPrice: 10.00');
					this._add_item(item);
				}
			},
			parent: this.wrapper.find('.item-field'),
			render_input: true
		});

		this.init_menu_items();
		this.init_action_items();
		this.init_buttons_events();
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
	init_buttons_events() {
	    const me = this;
        $('.pos-btn.pos-plus').click(function() {
            if (!me.selected_cart_item) {
                return;
            }
            me._increment_qty(me.selected_cart_item);
            me._render_items();
        });
        $('.pos-btn.pos-minus').click(function() {
            if (!me.selected_cart_item) {
                return;
            }
            me._decrement_qty(me.selected_cart_item);
            me._render_items();
        });
	}
	_increment_qty(item) {
	    item.qty = item.qty + 1;
	    item.total = item.rate * item.qty;
	}
	_decrement_qty(item) {
	    item.qty = item.qty - 1;
	    item.total = item.rate * item.qty;
	}
	_set_item_events() {
	    const me = this; // refers to the POS
	    $('.pos-item').click(function() {
	        // this refers to the selected item
	        const idx = $(this).data('idx');
	        me.selected_cart_item = me.cart_items[idx];
	        me._render_items();
	    });
	}
	_add_item(item) {
	    if (!item) {
	        return;
	    }
		this.$pos_items__empty.hide();
        this.cart_items.push({
            idx: this.cart_items.length,
            item_code: item.item_code,
            qty: 1,
            rate: 10.00,
            vat: 0.00,
            total: 10.00
        });
        this._render_items();
	}
	_render_items() {
	    this.$pos_items.empty();
	    this.cart_items.forEach((cart_item) => {
	        const interpolation = {
	            '{idx}': cart_item.idx,
                '{item-name}': cart_item.item_code,
                '{qty}': Number.parseFloat(cart_item.qty).toFixed(2),
                '{item-price}': Number.parseFloat(cart_item.rate).toFixed(2),
                '{vat}': Number.parseFloat(cart_item.vat).toFixed(2),
                '{total}': Number.parseFloat(cart_item.total).toFixed(2)
            };
            let template = frappe.templates.enhanced_pos_item;
            Object.keys(interpolation).forEach(function(key) {
                template = template.replace(key, interpolation[key]);
            });
            const template_item = $(template).appendTo(this.$pos_items);
            if (this.selected_cart_item && this.selected_cart_item.idx === cart_item.idx) {
                template_item.addClass('current-item');
            }
	    });
	    this._set_item_events();
	}

	// init_secondary_actions() {
	// 	this.page.set_secondary_action('Void Invoice', function() {
	// 		console.log('void invoice');
	// 	});
	// }
};
