import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OneTimeIntakeData {
    name: string;
    email: string;
    goal: string;
    fitness_level: string;
    allergies?: string;
    notes?: string;
}

const OneTimeIntakeForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const [form, setForm] = useState<OneTimeIntakeData>({
        name: "",
        email: "",
        goal: "",
        fitness_level: "",
        allergies: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Submit to Formspree (placeholder URL) and also save to Supabase.
            const FORMSPREE_URL = (window as any).ONE_TIME_FORMSPREE || "https://formspree.io/f/your-form-id";

            // Send to Formspree (for email notifications)
            const fs = fetch(FORMSPREE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    goal: form.goal,
                    fitness_level: form.fitness_level,
                    allergies: form.allergies,
                    notes: form.notes,
                }),
            });

            // Save to Supabase table `one_time_requests` (create this table if not present)
            const sb = supabase.from("one_time_requests" as any).insert([{
                name: form.name,
                email: form.email,
                goal: form.goal,
                fitness_level: form.fitness_level,
                allergies: form.allergies,
                notes: form.notes,
                created_at: new Date().toISOString()
            }]);

            // Keep original optional endpoint behavior (if the app integrates an API)
            const endpoint = (window as any).ONE_TIME_INTAKE_ENDPOINT || "/api/one-time-intake";
            const original = fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            // Wait for all to finish but ignore partial failures (we still show a friendly message)
            await Promise.allSettled([fs, sb, original]);

            setMessage("Thanks — your request was received. The trainer will deliver the PDF by email shortly.");
            setForm({ name: "", email: "", goal: "", fitness_level: "", allergies: "", notes: "" });
            onSuccess?.();
        } catch (err: any) {
            console.error(err);
            setMessage(err?.message || "Submission failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
                <label htmlFor="one_time_name" className="block text-sm font-medium">Full name</label>
                <input id="one_time_name" name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" title="Full name" className="input" />
            </div>

            <div>
                <label htmlFor="one_time_email" className="block text-sm font-medium">Email</label>
                <input id="one_time_email" name="email" value={form.email} onChange={handleChange} type="email" required placeholder="you@domain.com" title="Email address" className="input" />
            </div>

            <div>
                <label htmlFor="one_time_goal" className="block text-sm font-medium">Primary goal</label>
                <select id="one_time_goal" name="goal" value={form.goal} onChange={handleChange} required className="input" aria-label="Primary goal">
                    <option value="">Choose one</option>
                    <option value="weight_loss">Weight loss</option>
                    <option value="muscle_gain">Muscle gain</option>
                    <option value="general_fitness">General fitness</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div>
                <label htmlFor="one_time_fitness_level" className="block text-sm font-medium">Fitness level</label>
                <select id="one_time_fitness_level" name="fitness_level" value={form.fitness_level} onChange={handleChange} required className="input" aria-label="Fitness level">
                    <option value="">Choose one</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>

            <div>
                <label htmlFor="one_time_allergies" className="block text-sm font-medium">Allergies / dietary restrictions (optional)</label>
                <input id="one_time_allergies" name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. peanuts, lactose" title="Allergies" className="input" />
            </div>

            <div>
                <label htmlFor="one_time_notes" className="block text-sm font-medium">Additional notes (optional)</label>
                <textarea id="one_time_notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Tell us anything useful (injuries, schedule, preferences)" title="Additional notes" className="input" />
            </div>

            <div>
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? "Submitting…" : "Request custom plan"}
                </button>
            </div>

            {message && <p className="text-sm mt-2">{message}</p>}

            <style>{`\n        .input { width: 100%; padding: .5rem; border: 1px solid #e5e7eb; border-radius: .375rem }\n        .btn-primary { padding: .5rem 1rem; background: #1f2937; color: white; border-radius: .375rem }\n      `}</style>
        </form>
    );
};

export default OneTimeIntakeForm;
