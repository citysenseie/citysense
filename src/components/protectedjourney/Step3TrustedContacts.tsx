import { useState } from "react";
import DestinationCard from "../DestinationCard";
import { useTrustedContacts } from "@/hooks/useTrustedContacts";
import JourneyHeader from "./JourneyHeader";
interface Step3TrustedContactsProps {
  selectedContacts: string[];
  setSelectedContacts: (contacts: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function Step3TrustedContacts({
  selectedContacts,
  setSelectedContacts,
  onBack,
  onContinue,
}: Step3TrustedContactsProps) {
  const { contacts, loading } = useTrustedContacts();
  const [showContacts, setShowContacts] = useState(false);

  const toggleContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(
        selectedContacts.filter((contactId) => contactId !== id)
      );
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  return (
  <div className="pb-8">

    <button
      type="button"
      onClick={onBack}
      className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#7BA3A1] hover:text-[#F5F3EF]"
    >
      ← Back
    </button>

    <div className="space-y-3">
        <DestinationCard
          icon={<span className="text-2xl">👤</span>}
          title="Add Trusted Contact"
          subtitle={
            selectedContacts.length > 0
              ? `${selectedContacts.length} contact${
                  selectedContacts.length > 1 ? "s" : ""
                } selected`
              : "Choose from your contacts"
          }
          onClick={() => setShowContacts(!showContacts)}
        />
<JourneyHeader
  currentStep={3}
  totalSteps={5}
  title="Trusted contacts"
  subtitle="Choose who can be notified if necessary."
  onBack={onBack}
/>
        {showContacts && (
          <div className="rounded-2xl border border-[#2D5A5840] bg-[#142827] p-3">
            {loading ? (
              <div className="py-4 text-center text-sm text-[#7BA3A1]">
                Loading contacts...
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-5 text-center">
                <div className="text-sm font-semibold text-white">
                  No trusted contacts yet
                </div>

                <div className="mt-1 text-xs text-[#7BA3A1]">
                  Add a trusted contact from your CitySense profile first.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => {
                  const selected = selectedContacts.includes(contact.id);

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => toggleContact(contact.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[#4ADE80] bg-[#1D4038]"
                          : "border-[#2D5A5840] bg-[#1A2E2D]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28524F]">
                          <span className="text-lg">👤</span>
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            {contact.name}
                          </div>

                          <div className="text-xs text-[#7BA3A1]">
                            {contact.phone}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#4ADE80] bg-[#4ADE80] text-[#0F1E1E]"
                            : "border-[#6B8986] text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedContacts.length > 0 && (
          <div className="rounded-xl bg-[#142827] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#7BA3A1]">
              Selected contacts
            </div>

            <div className="mt-2 text-sm text-white">
              {selectedContacts.length} trusted contact
              {selectedContacts.length > 1 ? "s" : ""} will be notified if
              necessary.
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-full rounded-2xl bg-[#4ADE80] py-4 font-bold text-[#0F1E1E]"
      >
        Continue →
      </button>
    </div>
  );
}