# Copyright (c) 2024, Benjamin Bailon and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CashflowPeriod(Document):
	def before_save(self):
		if self.period_before:
			cashflow_period_before = frappe.get_doc("Cashflow Period", self.period_before)
			self.cash_now = cashflow_period_before.cash_at_end
		self.sort_by_date()
		self.recalculate_totals()
	
	def recalculate_totals(self):
		cash_now = self.cash_now

		for movement in self.movements:
			# Get the group type as its a link field
			group = frappe.get_doc("Cashflow Group", movement.group)
			if group.type == "Income":
				movement.total = abs(movement.total)
			elif group.type == "Expense":
				movement.total = abs(movement.total) * -1
			else:
				frappe.throw("Invalid group type at movement {0}".format(movement.name))
			cash_now += movement.total
			movement.running = cash_now

		self.cash_at_end = cash_now
	
	def sort_by_date(self):
		self.movements.sort(key=lambda x: x.date, reverse=False)