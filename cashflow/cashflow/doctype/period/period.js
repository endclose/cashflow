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
    incomes(frm) {
        console.log(frm.doc.incomes);
    },
    refresh(frm) {},
});

frappe.ui.form.on('Income', {
    incomes_add(frm) {
        recalculate(frm);
    },
    incomes_remove(frm) {
        recalculate(frm);
    },
    total(frm) {
        recalculate(frm);
    },
    deadline(frm, cdt, cdn) {
        check_date_bewteen(frm, cdt, cdn);
    },
});

frappe.ui.form.on('Outcome', {
    outcomes_add(frm) {
        recalculate(frm);
    },
    outcomes_remove(frm) {
        recalculate(frm);
    },
    total(frm) {
        recalculate(frm);
    },
    deadline(frm, cdt, cdn) {
        check_date_bewteen(frm, cdt, cdn);
    },
});

const recalculate = (frm) => {
    let total_incomes = 0;
    let total_outcomes = 0;

    frm.doc.incomes.forEach(
        (income) => (total_incomes += parseFloat(income.total))
    );
    frm.doc.outcomes.forEach(
        (outcome) => (total_outcomes += parseFloat(outcome.total))
    );
    frm.set_value(
        'cash_at_end',
        frm.doc.cash_now + total_incomes - total_outcomes
    );
    console.log(total_incomes, total_outcomes);
    console.log(frm.doc.incomes);
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
    if (
        register.deadline < frm.doc.date_from ||
        register.deadline > frm.doc.date_to
    ) {
        frappe.msgprint('The deadline must be between the period dates');
        frappe.model.set_value(cdt, cdn, 'deadline', '');
        frm.refresh_fields();
    }
};

const sort_registers = (frm) => {
    const incomes_sorted = frm.doc.incomes.sort((a, b) => {
        return new Date(a.deadline) - new Date(b.deadline);
    });
    const outomes_sorted = frm.doc.outcomes.sort((a, b) => {
        return new Date(a.deadline) - new Date(b.deadline);
    });
    frm.set_value('incomes', incomes_sorted);
    frm.set_value('outcomes', outomes_sorted);
};
