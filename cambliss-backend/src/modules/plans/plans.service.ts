import prisma from "../../config/prisma";

export const getActivePlans = async () => {
	try {
		return await prisma.plan.findMany({
			where: {
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				description: true,
				features: true,
				price: true,
				currency: true,
				interval: true,
				userLimit: true,
				storageLimit: true,
			},
			orderBy: {
				price: "asc",
			},
		});
	} catch (error) {
		throw new Error("Failed to fetch active plans");
	}
};
