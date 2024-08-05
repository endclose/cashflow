// Copyright (c) 2024, Benjamin Bailon and contributors
// For license information, please see license.txt

frappe.ui.form.on('Period', {
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
    refresh(frm) {},
});

frappe.ui.form.on('Cashflow Movement', {
    movements_add(frm, cdt, cdn) {},
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
                total_incomes += movement.total;
                cash_now += movement.total;
                break;
            case 'Expense':
                total_expenses += movement.total;
                cash_now -= movement.total;
                break;
        }
        frappe.model.set_value(
            movement.doctype,
            movement.name,
            'running',
            cash_now
        );
    });
    frm.set_value(
        'cash_at_end',
        frm.doc.cash_now + total_incomes - total_expenses
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
        frappe.msgprint('The deadline must be between the period dates');
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
