"use client";
import { useState } from "react";

import { CenteredLayout } from "@/src/components/layout/centered-layout.tsx";
import { Button } from "@/src/components/ui/Button.tsx";
import { Card } from "@/src/components/ui/Card.tsx";
import { Modal } from "@/src/components/ui/Modal.tsx";

export default function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <CenteredLayout className="flex-1">
        <Card className="w-full max-w-md">
          <Button onClick={() => setShowModal(true)}>Show Modal</Button>
        </Card>
      </CenteredLayout>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Test modal">
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  );
}
