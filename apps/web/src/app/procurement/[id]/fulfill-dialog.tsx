import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  PurchaseRequest,
  PurchaseRequestItem
} from "@cipansor/shared";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

interface FulfillDialogProps {
  request: PurchaseRequest;
  onSuccess: () => void;
}

const formSchema = z.object({
  paymentAccountId: z.string().min(1, "Payment account is required"),
  receiptDate: z.date(),
  purchaseOrderNo: z.string().optional(),
  supplier: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    itemName: z.string(), // Just for display/tracking
    quantityReceived: z.coerce.number().min(1),
    actualPrice: z.coerce.number().min(0),
    condition: z.enum(["GOOD", "FAIR", "POOR"]),
    roomId: z.string().optional(),
    notes: z.string().optional()
  }))
});

export function FulfillDialog({ request, onSuccess }: FulfillDialogProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<{id: string, name: string, code: string}[]>([]);
  const [rooms, setRooms] = useState<{id: string, name: string, code: string}[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiptDate: new Date(),
      items: request.items?.map(item => ({
        itemId: item.id,
        itemName: item.itemName,
        quantityReceived: item.quantity,
        actualPrice: item.estimatedPrice,
        condition: "GOOD",
        notes: ""
      })) || []
    },
  });

  useEffect(() => {
    if (open) {
      // Fetch Cash/Bank accounts
      api.get('/finance/accounts?type=ASSET&isCash=true')
        .then(res => {
          const cashAccounts = res.data.data.filter((acc: any) =>
            acc.name.toLowerCase().includes('kas') ||
            acc.name.toLowerCase().includes('bank') ||
            acc.code.startsWith('1-1')
          );
          setAccounts(cashAccounts);
        })
        .catch(console.error);

      // Fetch Rooms for asset location
      api.get('/facilities/rooms')
        .then(res => {
          setRooms(res.data.data);
        })
        .catch(console.error);
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await api.post(`/procurement/${request.id}/fulfill`, values);

      toast({
        title: "Success",
        description: "Request fulfilled successfully. Assets created.",
      });
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fulfill request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Fulfill / Receive Items</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fulfill Purchase Request</DialogTitle>
          <DialogDescription>
            Confirm receipt of items, enter actual costs, and select payment source.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receiptDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Account (Credit)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Cash/Bank Account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseOrderNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="PO-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">Items Received</h3>
              {form.watch("items").map((item, index) => (
                <div key={item.itemId} className="border p-4 rounded-md space-y-3">
                  <div className="font-semibold">{item.itemName}</div>
                  <div className="grid grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantityReceived`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty Received</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.actualPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Price / Unit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.condition`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="FAIR">Fair</SelectItem>
                              <SelectItem value="POOR">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.roomId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Room" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rooms.map(room => (
                                <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Fulfillment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
