import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentSubmission } from "@cipansor/shared";

const submissionSchema = z.object({
  content: z.string().optional(),
});

interface SubmissionFormProps {
  initialData?: AssignmentSubmission | null;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function SubmissionForm({
  initialData,
  onSubmit,
  isLoading,
}: SubmissionFormProps) {
  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: initialData?.content || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Answer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Type your answer here..."
                  {...field}
                  className="min-h-[150px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Submitting..."
            : initialData
              ? "Update Submission"
              : "Submit Assignment"}
        </Button>
      </form>
    </Form>
  );
}
