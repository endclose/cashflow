# Copyright (c) 2024, Benjamin Bailon and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Period(Document):
	def before_save(self):
		if self.period_before:
			period_before = frappe.get_doc("Period", self.period_before)
			self.cash_now = period_before.cash_at_end
		self.recalculate_totals()
	
	def recalculate_totals(self):
		total_income = 0
		total_expense = 0
		cash_now = self.cash_now

		for movement in self.movements:
			# Get the group type as its a link field
			group = frappe.get_doc("Cashflow Group", movement.group)
			if group.type == "Income":
				total_income += movement.total
				cash_now += movement.total
			elif group.type == "Expense":
				total_expense += movement.total
				cash_now -= movement.total
			else:
				frappe.throw("Invalid group type at movement {0}".format(movement.name))
			movement.running = cash_now

		self.cash_at_end = self.cash_now + total_income - total_expense