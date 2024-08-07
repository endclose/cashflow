// Copyright (c) 2024, Benjamin Bailon and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cashflow Period', {
    before_save(frm) {
        sort_registers(frm);
    },
    date_from(frm) {
        if (frm.doc.date_from > frm.doc.date_to) {
            frappe.msgprint(
                'The start date cannot be greater than the end date'
            );
            frm.doc.date_from = '';
            frm.refresh_fields();
        }
    },
    date_to(frm) {
        if (frm.doc.date_to < frm.doc.date_from) {
            frappe.msgprint('The end date cannot be less than the start date');
            frm.doc.date_to = '';
            frm.refresh_fields();
        }
    },
    async period_before(frm, cdt, cdn) {
        if (frm.doc.period_before) {
            if (frm.doc.period_before == frm.doc.name) {
                frappe.msgprint('You cannot select the same period');
                frm.set_value('period_before', '');
                frm.refresh_fields();
                return;
            }

            const period_before = await frappe.db.get_doc(
                'Cashflow Period',
                frm.doc.period_before
            );
            if (period_before.currency != frm.doc.currency) {
                frappe.msgprint(
                    'The currency of the previous period is different from the current period'
                );
                frm.set_value('period_before', '');
                frm.refresh_fields();
                return;
            }
            if (period_before) {
                console.log(period_before);
                frm.set_value('cash_now', period_before.cash_at_end);
                frm.set_value('currency', period_before.currency);
            }
        }
    },
    refresh(frm) {
        // Button to retrieve the current period before cast at end
        if (frm.doc.period_before) {
            frm.add_custom_button('Refresh cash now', async () => {
                const period_before_cash = await frappe.db.get_value(
                    'Cashflow Period',
                    { name: frm.doc.period_before },
                    'cash_at_end'
                );
                if (period_before_cash) {
                    frm.set_value(
                        'cash_now',
                        period_before_cash.message.cash_at_end
                    );
                }
            });
        }
    },
});

frappe.ui.form.on('Cashflow Movement', {
    movements_add(frm, cdt, cdn) {
        console.log(frm.doc.movements[frm.doc.movements.length - 1]);
    },
    movements_remove(frm) {
        recalculate(frm);
    },
    total(frm) {
        recalculate(frm);
    },
    group(frm) {
        recalculate(frm);
    },
    date(frm, cdt, cdn) {
        check_date_bewteen(frm, cdt, cdn);
    },
});

const recalculate = (frm) => {
    let total_incomes = 0;
    let total_expenses = 0;
    let cash_now = frm.doc.cash_now;

    frm.doc.movements.forEach((movement) => {
        switch (movement.type) {
            case 'Income':
                movement.total = Math.abs(movement.total);
                total_incomes += movement.total;
                cash_now += movement.total;
                break;
            case 'Expense':
                movement.total = Math.abs(movement.total) * -1;

                total_expenses += movement.total;
                cash_now += movement.total;
                break;
        }
        frappe.model.set_value(
            movement.doctype,
            movement.name,
            'total',
            movement.total
        );
        frappe.model.set_value(
            movement.doctype,
            movement.name,
            'running',
            cash_now
        );
    });
    frm.set_value(
        'cash_at_end',
        frm.doc.cash_now + total_incomes + total_expenses
    );
};

const check_date_bewteen = (frm, cdt, cdn) => {
    let register = frappe.get_doc(cdt, cdn);
    console.log(register);

    if (!frm.doc.date_from || !frm.doc.date_to) {
        frm.set_value(register.parentfield, []);
        frappe.msgprint({
            title: 'Error',
            indicator: 'red',
            message: 'You must set the period dates first',
        });
    }
    if (register.date < frm.doc.date_from || register.date > frm.doc.date_to) {
        frappe.msgprint(
            `The date must be between ${frm.doc.date_from} and ${frm.doc.date_to}, please check`
        );
        frappe.model.set_value(cdt, cdn, 'date', '');
        frm.refresh_fields();
    }
};

const sort_registers = (frm) => {
    const movements_sorted = frm.doc.movements.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    frm.set_value('movements', movements_sorted);
};
