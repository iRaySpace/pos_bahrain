{% include 'pos_bahrain/pos_bahrain/page/enhanced_pos/enhanced_pos_data.js' %}
{% include 'pos_bahrain/pos_bahrain/page/enhanced_pos/enhanced_pos_dialogs.js' %}
{% include 'pos_bahrain/pos_bahrain/page/enhanced_pos/enhanced_pos_actions.js' %}

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
	    this.init_state();
		this.wrapper = $(wrapper)
			.find('.layout-main-section')
			.append('<div id="app"></div>');
		this.page = wrapper.page;
		frappe.require(['assets/css/enhanced_pos.min.css'], () => {
			this.init();
			this.init_sales_invoice_frm();
			init_pos_actions(this);
		});
	}
	init_state() {
	    this.cart_items = [];
	    this.selected_cart_item = null;
	    this.customer_field && this.customer_field.set_value('');
	    this.item_field && this.item_field.set_value('');
	    this.item_detail_field && this.item_detail_field.set_value('');
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
				},
			},
			parent: this.wrapper.find('.customer-field'),
			render_input: true
		});
        this.customer_field = customer_field;

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
        this.item_detail_field = item_detail_field;

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
        this.item_field = item_field;

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
	    $('.pos-btn.pos-change-qty').click(async function() {
	        if (!me.selected_cart_item) {
	            return;
	        }
	        const data = await prompt_change_qty();
	        me._set_qty(me.selected_cart_item, data.qty);
	        me._render_items();
	        me._render_totals();
	    });
	    $('.pos-btn.pos-change-price').click(async function() {
	        if (!me.selected_cart_item) {
	            return;
	        }
	        const data = await prompt_change_price();
	        me._set_rate(me.selected_cart_item, data.rate);
	        me._render_items();
	        me._render_totals();
	    });
	    $('.pos-btn.pos-delete-item').click(async function() {
	        if (!me.selected_cart_item) {
	            return;
	        }
            const choice = await confirm_delete_item();
            if (choice) {
                me._delete_item(me.selected_cart_item.idx);
                me.selected_cart_item = null;
                me._render_items();
                me._render_totals();
            }
	    });
        $('.pos-btn.pos-plus').click(function() {
            if (!me.selected_cart_item) {
                return;
            }
            me._increment_qty(me.selected_cart_item);
            me._render_items();
            me._render_totals();
        });
        $('.pos-btn.pos-minus').click(function() {
            if (!me.selected_cart_item) {
                return;
            }
            me._decrement_qty(me.selected_cart_item);
            me._render_items();
            me._render_totals();
        });
	}
	async init_sales_invoice_frm() {
	    await frappe.model.with_doctype('Sales Invoice');
	    const name = frappe.model.make_new_doc_and_get_name('Sales Invoice', true);
	    const frm = new _f.Frm('Sales Invoice', $('<div>'), false);
	    frm.refresh(name);
	    frm.set_value('items', []);
	    frm.set_value('is_pos', 1);
        this.frm = frm;
        this._get_pos_profile();
	}
	on(target, fn) {
	    $(target).click(fn);
	}
	refresh() {
	    this._render_items();
	}
	async prompt_payment() {
	    const values = await payment_dialog(this.frm.doc.payments);
	    return values;
	}
	get_totals() {
	    let subtotal = 0.00;
	    let discount = 0.00;
	    let tax = 0.00;
	    this.cart_items.forEach(function(cart_item) {
	        subtotal = subtotal + cart_item.total;
	        tax = tax + cart_item.vat;
	    });
	    let total = subtotal + discount + tax;
	    return { subtotal, discount, tax, total };
	}
	async _get_pos_profile() {
	    if (this.pos_profile) {
	        return;
	    }
	    this.pos_profile = await get_pos_profile(this.frm.doc.company);
	    this.frm.set_value('pos_profile', this.pos_profile.name);
	}
	_increment_qty(item) {
	    item.qty = item.qty + 1;
	    item.total = item.rate * item.qty;
	}
	_decrement_qty(item) {
	    item.qty = item.qty - 1;
	    item.total = item.rate * item.qty;
	}
	_set_qty(item, qty) {
	    item.qty = qty;
	    item.total = item.rate * qty;
	}
	_set_rate(item, rate) {
	    item.rate = rate;
	    item.total = rate * item.qty;
	}
	_delete_item(idx) {
	    const filtered_items = this.cart_items.filter((cart_item) => cart_item.idx !== idx);
	    this.cart_items = filtered_items;
	}
	_set_item_events() {
	    const me = this; // refers to the POS
	    $('.pos-item').click(function() {
	        // this refers to the selected item
	        const idx = $(this).data('idx');
	        if (!me.selected_cart_item) {
	            me.selected_cart_item = me.cart_items[idx];
	        } else {
	            if (me.selected_cart_item.idx === idx) {
	                me.selected_cart_item = null;
	            }
	        }
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
        this._render_totals();
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
    _render_totals() {
        const totals = this.get_totals();
        $('.subtotal-value').html(totals.subtotal.toFixed(2));
        $('.discount-value').html(totals.discount.toFixed(2));
        $('.tax-value').html(totals.tax.toFixed(2));
        $('.total-value').html(totals.total.toFixed(2));
    }
	// init_secondary_actions() {
	// 	this.page.set_secondary_action('Void Invoice', function() {
	// 		console.log('void invoice');
	// 	});
	// }
};
