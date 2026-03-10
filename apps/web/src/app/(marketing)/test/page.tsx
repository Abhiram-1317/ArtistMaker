"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Spinner,
  Modal,
  ModalContent,
  useToast,
} from "@genesis/ui";

/* ── Toast demo (needs its own component because of the hook) ─────────────── */

function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        size="sm"
        onClick={() =>
          toast({ variant: "success", title: "Saved!", description: "Your project has been saved." })
        }
      >
        Success Toast
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() =>
          toast({ variant: "error", title: "Error", description: "Something went wrong." })
        }
      >
        Error Toast
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          toast({ variant: "warning", title: "Warning", description: "Storage almost full." })
        }
      >
        Warning Toast
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() =>
          toast({ variant: "info", title: "Info", description: "New update available." })
        }
      >
        Info Toast
      </Button>
    </div>
  );
}

/* ── Main test page ───────────────────────────────────────────────────────── */

export default function ComponentTestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLoadingClick() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <div className="min-h-screen bg-surface p-8 md:p-12">
      <div className="mx-auto max-w-4xl space-y-16">
        {/* ───────── Header ───────── */}
        <header>
          <h1 className="text-3xl font-heading font-bold text-white">
            Component Test Page
          </h1>
          <p className="mt-2 text-gray-400">
            Every <code className="text-purple-400">@genesis/ui</code> component rendered in one place.
          </p>
        </header>

        {/* ───────── 1. Button ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            1. Button
          </h2>

          {/* Variants */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Variants</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Loading */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Loading State</h3>
            <Button loading={loading} onClick={handleLoadingClick}>
              {loading ? "Processing…" : "Click to Load"}
            </Button>
          </div>

          {/* Icons */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">With Icons</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                iconLeft={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                }
              >
                Icon Left
              </Button>
              <Button
                variant="secondary"
                iconRight={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                }
              >
                Icon Right
              </Button>
            </div>
          </div>

          {/* Disabled */}
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Disabled</h3>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* ───────── 2. Input ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            2. Input
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Basic with label */}
            <Input
              label="Project Name"
              placeholder="Enter project name"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError(e.target.value.length > 0 && e.target.value.length < 3 ? "Must be at least 3 characters" : "");
              }}
              error={inputError}
            />

            {/* Email with prefix icon */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              prefixIcon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              }
            />

            {/* Password with hint */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              hint="Must be at least 8 characters"
              prefixIcon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              }
            />

            {/* Disabled */}
            <Input label="Disabled" placeholder="Can't type here" disabled />

            {/* Sizes */}
            <Input label="Small" size="sm" placeholder="Small input" />
            <Input label="Large" size="lg" placeholder="Large input" />
          </div>
        </section>

        {/* ───────── 3. Card ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            3. Card
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Default */}
            <Card>
              <CardHeader>Default Card</CardHeader>
              <CardBody>
                This is a default card with header, body, and footer slots.
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="ghost">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            {/* Elevated + hover */}
            <Card variant="elevated" hover>
              <CardHeader>Elevated + Hover</CardHeader>
              <CardBody>
                Hover over this card to see the purple glow border effect.
              </CardBody>
              <CardFooter>
                <Badge variant="success">Active</Badge>
              </CardFooter>
            </Card>

            {/* Outlined */}
            <Card variant="outlined" hover>
              <CardHeader>Outlined</CardHeader>
              <CardBody>
                An outlined transparent card with the hover glow effect enabled.
              </CardBody>
            </Card>

            {/* With image background */}
            <Card
              image="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=80"
              overlayOpacity={70}
              hover
              className="sm:col-span-2 lg:col-span-3"
            >
              <CardHeader className="text-white">Image Background Card</CardHeader>
              <CardBody className="text-gray-200">
                This card has a background image with a dark overlay. The content remains readable.
              </CardBody>
              <CardFooter className="border-white/10">
                <Badge variant="info">Featured</Badge>
                <Button size="sm" variant="secondary">Learn More</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* ───────── 4. Badge ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            4. Badge
          </h2>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </section>

        {/* ───────── 5. Spinner ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            5. Spinner
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Spinner size={16} className="text-purple-400 mx-auto" />
              <p className="text-xs text-gray-500 mt-2">16px</p>
            </div>
            <div className="text-center">
              <Spinner size={24} className="text-purple-400 mx-auto" />
              <p className="text-xs text-gray-500 mt-2">24px</p>
            </div>
            <div className="text-center">
              <Spinner size={32} className="text-pink-400 mx-auto" />
              <p className="text-xs text-gray-500 mt-2">32px</p>
            </div>
            <div className="text-center">
              <Spinner size={48} className="text-white mx-auto" />
              <p className="text-xs text-gray-500 mt-2">48px</p>
            </div>
          </div>
        </section>

        {/* ───────── 6. Modal ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            6. Modal
          </h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>

          <Modal open={modalOpen} onOpenChange={setModalOpen}>
            <ModalContent title="Create New Project" description="Fill in the details to start a new cinematic project.">
              <div className="space-y-4">
                <Input label="Project Name" placeholder="My Awesome Film" />
                <Input label="Description" placeholder="A short description…" />
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>Create</Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        </section>

        {/* ───────── 7. Toast ───────── */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
            7. Toast Notifications
          </h2>
          <p className="text-sm text-gray-400">Click a button to trigger a toast in the bottom-right corner.</p>
          <ToastDemo />
        </section>

        {/* spacer */}
        <div className="h-24" />
      </div>
    </div>
  );
}
