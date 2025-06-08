// Updated seller dashboard with 4-stage automated email workflow
// This contains the replacement code for the dropdown menus

// Replace the first dropdown (around line 988-1001) with:
<div className="flex items-center gap-2">
  <Badge variant={
    order.order_status === 'delivered' || order.status === 'delivered' ? 'default' :
    order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery' ? 'secondary' :
    order.order_status === 'shipped' || order.status === 'shipped' ? 'outline' : 
    order.order_status === 'processing' || order.status === 'processing' ? 'secondary' : 'destructive'
  }>
    {order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery' ? 'Out for Delivery' : 
     (order.order_status || order.status)?.charAt(0).toUpperCase() + (order.order_status || order.status)?.slice(1) || 'Pending'}
  </Badge>
  
  {/* 4-Stage Email Workflow Buttons */}
  <div className="flex gap-1">
    {(order.order_status !== 'processing' && order.status !== 'processing' && 
      order.order_status !== 'shipped' && order.status !== 'shipped' && 
      order.order_status !== 'out_for_delivery' && order.status !== 'out_for_delivery' && 
      order.order_status !== 'delivered' && order.status !== 'delivered') && (
      <Button
        size="sm"
        variant="outline"
        className="text-xs px-2 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
        onClick={() => updateOrderStatusMutation.mutate({
          orderId: order.order_id || order.id,
          status: 'processing'
        })}
        disabled={updateOrderStatusMutation.isPending}
        title="Start Processing - Sends 'Order Confirmed' email"
      >
        📧 Process
      </Button>
    )}
    
    {(order.order_status === 'processing' || order.status === 'processing') && (
      <Button
        size="sm"
        variant="outline"
        className="text-xs px-2 py-1 text-green-600 border-green-200 hover:bg-green-50"
        onClick={() => updateOrderStatusMutation.mutate({
          orderId: order.order_id || order.id,
          status: 'shipped'
        })}
        disabled={updateOrderStatusMutation.isPending}
        title="Mark as Shipped - Sends 'Order Shipped' email"
      >
        📦 Ship
      </Button>
    )}
    
    {(order.order_status === 'shipped' || order.status === 'shipped') && (
      <Button
        size="sm"
        variant="outline"
        className="text-xs px-2 py-1 text-orange-600 border-orange-200 hover:bg-orange-50"
        onClick={() => updateOrderStatusMutation.mutate({
          orderId: order.order_id || order.id,
          status: 'out_for_delivery'
        })}
        disabled={updateOrderStatusMutation.isPending}
        title="Out for Delivery - Sends 'Arriving Today' email"
      >
        🚚 Deliver
      </Button>
    )}
    
    {(order.order_status === 'out_for_delivery' || order.status === 'out_for_delivery') && (
      <Button
        size="sm"
        variant="outline"
        className="text-xs px-2 py-1 text-purple-600 border-purple-200 hover:bg-purple-50"
        onClick={() => updateOrderStatusMutation.mutate({
          orderId: order.order_id || order.id,
          status: 'delivered'
        })}
        disabled={updateOrderStatusMutation.isPending}
        title="Mark as Delivered - Sends 'Order Delivered' email"
      >
        ✅ Complete
      </Button>
    )}
  </div>
</div>

// The same replacement should be applied to the second dropdown (around line 1089-1094)
// Each button click triggers the automated email workflow:
// 1. Processing → "Order Confirmed" email
// 2. Shipped → "Order Shipped" email  
// 3. Out for Delivery → "Arriving Today" email
// 4. Delivered → "Order Delivered" email