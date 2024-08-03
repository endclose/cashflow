# Copyright (c) 2024, Benjamin Bailon and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Period(Document):
	def before_save(self):
		self.recalculate_totals()
	
	def recalculate_totals(self):
		total_incomes = sum([income.total for income in self.incomes])
		total_outcomes = sum([outcome.total for outcome in self.outcomes])

		self.cash_at_end = self.cash_now + total_incomes - total_outcomes