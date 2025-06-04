import { relations } from "drizzle-orm/relations";
import { users, libraryIntegrationRequests, physicalBooks, bookLoans, eBooks, groupBuyCampaigns, shoppingGroups, groupBuyCampaignProducts, groupBuyProducts, products, groupBuyOrders, groupBuyParticipants } from "./schema";

export const libraryIntegrationRequestsRelations = relations(libraryIntegrationRequests, ({one}) => ({
	user_sellerId: one(users, {
		fields: [libraryIntegrationRequests.sellerId],
		references: [users.id],
		relationName: "libraryIntegrationRequests_sellerId_users_id"
	}),
	user_processedBy: one(users, {
		fields: [libraryIntegrationRequests.processedBy],
		references: [users.id],
		relationName: "libraryIntegrationRequests_processedBy_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	libraryIntegrationRequests_sellerId: many(libraryIntegrationRequests, {
		relationName: "libraryIntegrationRequests_sellerId_users_id"
	}),
	libraryIntegrationRequests_processedBy: many(libraryIntegrationRequests, {
		relationName: "libraryIntegrationRequests_processedBy_users_id"
	}),
	bookLoans: many(bookLoans),
	eBooks: many(eBooks),
	groupBuyCampaigns: many(groupBuyCampaigns),
	groupBuyProducts_sellerId: many(groupBuyProducts, {
		relationName: "groupBuyProducts_sellerId_users_id"
	}),
	groupBuyProducts_approvedBy: many(groupBuyProducts, {
		relationName: "groupBuyProducts_approvedBy_users_id"
	}),
	groupBuyOrders: many(groupBuyOrders),
	groupBuyParticipants: many(groupBuyParticipants),
}));

export const bookLoansRelations = relations(bookLoans, ({one}) => ({
	physicalBook: one(physicalBooks, {
		fields: [bookLoans.bookId],
		references: [physicalBooks.id]
	}),
	user: one(users, {
		fields: [bookLoans.borrowerId],
		references: [users.id]
	}),
}));

export const physicalBooksRelations = relations(physicalBooks, ({many}) => ({
	bookLoans: many(bookLoans),
}));

export const eBooksRelations = relations(eBooks, ({one}) => ({
	user: one(users, {
		fields: [eBooks.sellerId],
		references: [users.id]
	}),
}));

export const groupBuyCampaignsRelations = relations(groupBuyCampaigns, ({one, many}) => ({
	user: one(users, {
		fields: [groupBuyCampaigns.createdBy],
		references: [users.id]
	}),
	shoppingGroup: one(shoppingGroups, {
		fields: [groupBuyCampaigns.shoppingGroupId],
		references: [shoppingGroups.id]
	}),
	groupBuyCampaignProducts: many(groupBuyCampaignProducts),
	groupBuyOrders: many(groupBuyOrders),
	groupBuyParticipants: many(groupBuyParticipants),
}));

export const shoppingGroupsRelations = relations(shoppingGroups, ({many}) => ({
	groupBuyCampaigns: many(groupBuyCampaigns),
}));

export const groupBuyCampaignProductsRelations = relations(groupBuyCampaignProducts, ({one}) => ({
	groupBuyCampaign: one(groupBuyCampaigns, {
		fields: [groupBuyCampaignProducts.campaignId],
		references: [groupBuyCampaigns.id]
	}),
	groupBuyProduct: one(groupBuyProducts, {
		fields: [groupBuyCampaignProducts.groupBuyProductId],
		references: [groupBuyProducts.id]
	}),
}));

export const groupBuyProductsRelations = relations(groupBuyProducts, ({one, many}) => ({
	groupBuyCampaignProducts: many(groupBuyCampaignProducts),
	product: one(products, {
		fields: [groupBuyProducts.productId],
		references: [products.id]
	}),
	user_sellerId: one(users, {
		fields: [groupBuyProducts.sellerId],
		references: [users.id],
		relationName: "groupBuyProducts_sellerId_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [groupBuyProducts.approvedBy],
		references: [users.id],
		relationName: "groupBuyProducts_approvedBy_users_id"
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	groupBuyProducts: many(groupBuyProducts),
}));

export const groupBuyOrdersRelations = relations(groupBuyOrders, ({one}) => ({
	groupBuyCampaign: one(groupBuyCampaigns, {
		fields: [groupBuyOrders.campaignId],
		references: [groupBuyCampaigns.id]
	}),
	user: one(users, {
		fields: [groupBuyOrders.userId],
		references: [users.id]
	}),
}));

export const groupBuyParticipantsRelations = relations(groupBuyParticipants, ({one}) => ({
	groupBuyCampaign: one(groupBuyCampaigns, {
		fields: [groupBuyParticipants.campaignId],
		references: [groupBuyCampaigns.id]
	}),
	user: one(users, {
		fields: [groupBuyParticipants.userId],
		references: [users.id]
	}),
}));