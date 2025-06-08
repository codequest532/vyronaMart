import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, Clock, CheckCircle, Copy, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  itemId: number;
  amount: number;
  userId: number;
  onPaymentSuccess?: (referenceId: string) => void;
}

interface UPIPaymentData {
  success: boolean;
  qrCode: string;
  upiString: string;
  referenceId: string;
  amount: number;
  virtualUPI: string;
  paymentLink: string;
  requiresManualVerification: boolean;
  expiryTime: string;
  instructions: string[];
}

export function UPIPaymentModal({
  isOpen,
  onClose,
  roomId,
  itemId,
  amount,
  userId,
  onPaymentSuccess
}: UPIPaymentModalProps) {
  const [paymentData, setPaymentData] = useState<UPIPaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  // Generate UPI QR code when modal opens
  useEffect(() => {
    if (isOpen && !paymentData) {
      generateQRCode();
    }
  }, [isOpen]);

  // Timer for expiry
  useEffect(() => {
    if (paymentData) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(paymentData.expiryTime).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft('Expired');
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentData]);

  // Auto-check payment status
  useEffect(() => {
    if (paymentData && paymentStatus === 'pending') {
      const statusTimer = setInterval(() => {
        checkPaymentStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(statusTimer);
    }
  }, [paymentData, paymentStatus]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/payments/upi-qr/generate', {
        roomId,
        itemId,
        amount,
        userId
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentData(data);
        toast({
          title: "QR Code Generated",
          description: "Scan the QR code to pay your contribution",
        });
      } else {
        throw new Error(data.error || 'Failed to generate QR code');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate payment QR code",
        variant: "destructive"
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData || checking) return;
    
    setChecking(true);
    try {
      const response = await apiRequest('GET', `/api/payments/upi-qr/status/${paymentData.referenceId}`);
      const data = await response.json();
      
      if (data.isCompleted) {
        setPaymentStatus('completed');
        toast({
          title: "Payment Successful!",
          description: `₹${amount} contribution received`,
        });
        onPaymentSuccess?.(paymentData.referenceId);
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleManualVerification = async () => {
    if (!paymentData || !transactionId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your transaction ID",
        variant: "destructive"
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await apiRequest('POST', '/api/payments/verify-manual', {
        referenceId: paymentData.referenceId,
        transactionId: transactionId.trim(),
        amount: paymentData.amount
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('completed');
        toast({
          title: "Payment Verified!",
          description: "Your contribution has been confirmed",
        });
        onPaymentSuccess?.(paymentData.referenceId);
        setTimeout(onClose, 2000);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Please check your transaction ID and try again",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyUPIString = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.upiString);
      toast({
        title: "Copied!",
        description: "UPI payment string copied to clipboard",
      });
    }
  };

  const copyVirtualUPI = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.virtualUPI);
      toast({
        title: "Copied!",
        description: "Virtual UPI ID copied to clipboard",
      });
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setPaymentStatus('pending');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            UPI Payment
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Generating QR Code...</p>
          </div>
        ) : paymentData ? (
          <div className="space-y-4">
            {/* Payment Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Amount to Pay</span>
                <span className="text-2xl font-bold text-primary">₹{amount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={paymentStatus === 'completed' ? 'default' : 'secondary'}>
                  {paymentStatus === 'completed' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : checking ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {paymentStatus === 'completed' ? 'Completed' : checking ? 'Checking...' : 'Pending'}
                </Badge>
              </div>
              {timeLeft && paymentStatus !== 'completed' && (
                <div className="text-sm text-muted-foreground mt-1">
                  Expires in: {timeLeft}
                </div>
              )}
            </Card>

            {paymentStatus !== 'completed' && (
              <>
                {/* QR Code */}
                <Card className="p-4">
                  <div className="text-center">
                    <div className="mb-3">
                      <img 
                        src={paymentData.qrCode} 
                        alt="UPI QR Code" 
                        className="w-48 h-48 mx-auto border rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan with any UPI app
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyUPIString}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy UPI Link
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Virtual UPI ID */}
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Virtual UPI ID</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={copyVirtualUPI}
                        className="h-auto p-1"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm font-mono bg-muted p-2 rounded">
                      {paymentData.virtualUPI}
                    </div>
                  </div>
                </Card>

                {/* Instructions */}
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    How to Pay
                  </h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    {paymentData.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary font-medium">{index + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </Card>

                {/* Payment Verification Options */}
                {paymentData.requiresManualVerification ? (
                  <>
                    {/* Manual Verification Section */}
                    {!showManualVerification ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={checkPaymentStatus}
                          disabled={checking}
                          className="w-full"
                          variant="outline"
                        >
                          {checking ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking Status...
                            </>
                          ) : (
                            'Check Payment Status'
                          )}
                        </Button>
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">
                            Payment not detected automatically?
                          </p>
                          <Button 
                            onClick={() => setShowManualVerification(true)}
                            variant="ghost"
                            size="sm"
                          >
                            Verify Payment Manually
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Card className="p-4">
                        <h4 className="font-medium mb-3">Manual Payment Verification</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Transaction ID</label>
                            <input
                              type="text"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Enter UPI transaction ID"
                              className="w-full mt-1 p-2 border rounded-md text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Found in your UPI app's transaction history
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={handleManualVerification}
                              disabled={verifying || !transactionId.trim()}
                              className="flex-1"
                            >
                              {verifying ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                'Verify Payment'
                              )}
                            </Button>
                            <Button
                              onClick={() => setShowManualVerification(false)}
                              variant="outline"
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </>
                ) : (
                  <Button 
                    onClick={checkPaymentStatus}
                    disabled={checking}
                    className="w-full"
                    variant="outline"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking Status...
                      </>
                    ) : (
                      'Check Payment Status'
                    )}
                  </Button>
                )}
              </>
            )}

            {paymentStatus === 'completed' && (
              <Card className="p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h3 className="font-medium text-green-700 mb-1">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your contribution of ₹{amount} has been received
                </p>
              </Card>
            )}
          </div>
        ) : null}

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
          >
            {paymentStatus === 'completed' ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}