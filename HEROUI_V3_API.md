# HeroUI v3 API Reference (v3.2.2)

HeroUI v3 is built on **React Aria Components (RAC)**. It uses **compound components** and does NOT use the `color` prop for most components.

## Critical Differences from v2

### Imports — what EXISTS and what does NOT

| ❌ v2 (DOES NOT EXIST in v3) | ✅ v3 Correct |
|------------------------------|---------------|
| `CardBody` | `Card.Content` |
| `CardHeader` | `Card.Header` |
| `Divider` | `Separator` |
| `Textarea` | `TextArea` |
| `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter` | compound: see below |
| `SelectItem` | `ListBoxItem` |
| `Pagination` (with total/page props) | compound Pagination (see below) |

### Button

```tsx
import { Button } from "@heroui/react";

// Props: variant, size, fullWidth, isIconOnly, isDisabled, onPress, isLoading (NO color prop)
// variant: "primary" | "secondary" | "danger" | "danger-soft" | "ghost" | "outline" | "tertiary"
// size: "sm" | "md" | "lg"
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="danger-soft">Danger Soft</Button>
<Button size="sm" isDisabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
<Button onPress={() => {}}>Click</Button>
// isLoading does NOT exist — use isDisabled + manual spinner, OR just show text
```

### Card (compound — use sub-components)

```tsx
import { Card } from "@heroui/react";

<Card variant="elevated"> {/* or "filled" | "outlined" | "solid" */}
  <Card.Header>header content</Card.Header>
  <Card.Title>title text</Card.Title>
  <Card.Description>description text</Card.Description>
  <Card.Content>main body content</Card.Content>
  <Card.Footer>footer content</Card.Footer>
</Card>

// Each sub-component is also available: CardHeader, CardContent, CardFooter, CardTitle, CardDescription
```

### Separator (replaces Divider)

```tsx
import { Separator } from "@heroui/react";

<Separator /> {/* horizontal by default */}
<Separator orientation="vertical" />
```

### Chip (status badges)

```tsx
import { Chip } from "@heroui/react";

// color: "default" | "danger" | "accent" | "success" | "warning"  (NO "primary" or "secondary")
// variant: "solid" | "soft" | "outline" | "dot"
// size: "sm" | "md" | "lg"
<Chip color="success" variant="soft" size="sm">Paid</Chip>
<Chip color="warning" variant="soft" size="sm">Pending</Chip>
<Chip color="danger" variant="soft" size="sm">Overdue</Chip>
<Chip color="default" variant="soft" size="sm">Completed</Chip>
<Chip color="accent" variant="soft" size="sm">Approved</Chip>
```

### Table (compound, RAC-based)

```tsx
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";

// NOTE: No isLoading prop on TableBody. Handle loading outside the table.
<Table>
  <TableHeader>
    <TableColumn id="name">Name</TableColumn>
    <TableColumn id="email">Email</TableColumn>
  </TableHeader>
  <TableBody>
    {(item) => (
      <TableRow>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>

// OR explicit rows:
<Table>
  <TableHeader>
    <TableColumn id="name">Name</TableColumn>
  </TableHeader>
  <TableBody items={items}>
    {items.map((item) => (
      <TableRow key={item.id} id={item.id}>
        <TableCell>{item.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Empty state: use render function on TableBody or handle before table
```

### Input / TextArea (RAC pattern — use with Label inside TextField)

```tsx
import { TextField, Input, TextArea, Label, FieldError, Description } from "@heroui/react";

// v3 Input does NOT have a `label` prop. Wrap in TextField with Label.
<TextField>
  <Label>Email</Label>
  <Input placeholder="Enter email" />
  <FieldError />
</TextField>

// Controlled:
<TextField value={value} onChange={setValue}>
  <Label>Email</Label>
  <Input placeholder="Enter email" />
</TextField>

// TextArea:
<TextField>
  <Label>Notes</Label>
  <TextArea placeholder="Enter notes" />
</TextField>
```

### Select (compound — uses ListBox/ListBoxItem inside)

```tsx
import { Select, ListBox, ListBoxItem } from "@heroui/react";

// selectedKeys and onSelectionChange come from React Aria
<Select selectedKeys={[value]} onSelectionChange={(keys) => setValue(Array.from(keys)[0])}>
  <Select.Trigger />
  <Select.Popover>
    <ListBox>
      <ListBoxItem id="option1">Option 1</ListBoxItem>
      <ListBoxItem id="option2">Option 2</ListBoxItem>
    </ListBox>
  </Select.Popover>
</Select>
```

### Modal (compound — Modal.Trigger, Modal.Container, etc.)

```tsx
import { Modal, Button } from "@heroui/react";

// Modal uses isOpen/onOpenChange. Inside use compound parts.
<Modal isOpen={isOpen} onOpenChange={setIsOpen}>
  <Modal.Container>
    <Modal.Header>
      <Modal.Heading>Title</Modal.Heading>
    </Modal.Header>
    <Modal.Body>
      body content
    </Modal.Body>
    <Modal.Footer>
      <Button variant="ghost" onPress={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onPress={handleSave}>Save</Button>
    </Modal.Footer>
  </Modal.Container>
</Modal>
```

### Tabs (compound)

```tsx
import { Tabs } from "@heroui/react";

<Tabs selectedKey={activeTab} onSelectionChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Tab id="all">All</Tabs.Tab>
    <Tabs.Tab id="pending">Pending</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="all">Content for all</Tabs.Panel>
</Tabs>
```

### Pagination (compound — NOT the simple v2 API)

```tsx
// v3 Pagination is a compound, RAC-style pagination (Previous/Next/Links).
// For simple page navigation, build a custom component OR use Pagination.Root with children.
// SIMPLEST: just render manual page buttons with Button components.

// Manual simple pagination:
<div className="flex gap-2">
  <Button size="sm" variant="outline" onPress={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
  <span className="px-3 py-1">{page} / {totalPages}</span>
  <Button size="sm" variant="outline" onPress={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
</div>
```

### Avatar

```tsx
import { Avatar } from "@heroui/react";
<Avatar src="/img.png" alt="User" />
```

## Summary of prop migrations

| v2 prop | v3 equivalent |
|---------|---------------|
| `Button color="primary"` | `Button variant="primary"` |
| `Button color="danger"` | `Button variant="danger"` |
| `Button color="success"` | `Button variant="primary"` + className |
| `Button variant="flat"` | `Button variant="ghost"` or `variant="tertiary"` |
| `Button variant="light"` | `Button variant="ghost"` |
| `Button isLoading` | remove + handle manually (or isDisabled) |
| `Chip color="primary"` | `Chip color="accent"` |
| `Chip color="secondary"` | `Chip color="default"` |
| `Chip variant="flat"` | `Chip variant="soft"` |
| `Input label="X"` | wrap in `<TextField><Label>X</Label><Input/></TextField>` |
| `Input isRequired` | put on TextField: `<TextField isRequired>` |
| `CardBody` | `Card.Content` |
| `CardHeader` | `Card.Header` |
| `Divider` | `Separator` |
| `Textarea` | `TextArea` |
| `SelectItem` | `ListBoxItem` |
