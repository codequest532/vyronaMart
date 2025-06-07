import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function MyVyronaTest() {
  // Get current user from localStorage or context
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id": 1}');

  // Fetch user's purchased books
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: [`/api/orders/user/${currentUser.id}`],
    enabled: !!currentUser.id
  });

  console.log('Purchases data:', purchases);
  console.log('Is loading:', purchasesLoading);

  if (purchasesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1>MyVyrona Test</h1>
      <p>Purchases: {purchases.length}</p>
      <pre>{JSON.stringify(purchases, null, 2)}</pre>
    </div>
  );
}