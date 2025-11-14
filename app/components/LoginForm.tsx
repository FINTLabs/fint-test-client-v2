import { useState } from "react";
import {
  Button,
  TextField,
  Textarea,
  ReadMore,
  VStack,
  HGrid,
} from "@navikt/ds-react";
import { Form } from "react-router";
import { validateUsername, validateClientId, validateSecretJson } from "~/utils/validation";

type SecretFormFields = {
  username: string;
  password: string;
  clientId: string;
  openIdSecret: string;
  assetIds: string;
  scope: string;
  idpUri: string;
};

type Errors = {
  clientId?: string;
  openIdSecret?: string;
  username?: string;
  password?: string;
};

const expectedKeys: (keyof SecretFormFields)[] = [
  "username",
  "password",
  "clientId",
  "openIdSecret",
  "assetIds",
  "scope",
  "idpUri",
];

function isValidSecretJson(obj: any): obj is SecretFormFields {
  if (typeof obj !== "object" || obj === null) return false;

  const keys = Object.keys(obj);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((k) => typeof obj[k] === "string")
  );
}

export function LoginFormWithJsonPrefill({
  onSubmit,
  isLoading,
}: {
  onSubmit: (formData: FormData) => void;
  isLoading?: boolean;
}) {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const DEFAULT_FORM_DATA: SecretFormFields = {
    username: "",
    password: "",
    clientId: "",
    openIdSecret: "",
    assetIds: "",
    scope: "",
    idpUri: "",
  };
  const [formData, setFormData] = useState<SecretFormFields>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Errors>({});

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    setJsonInput(input);
    setJsonError("");

    if (!input.trim()) {
      setFormData(DEFAULT_FORM_DATA);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (isValidSecretJson(parsed) && validateSecretJson(parsed)) {
        setFormData(parsed);
      } else {
        setFormData(DEFAULT_FORM_DATA);
        setJsonError("JSON does not match expected structure or contains invalid characters.");
      }
    } catch (err) {
      setFormData(DEFAULT_FORM_DATA);
      setJsonError("Invalid JSON format.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Errors = {};
    const requiredFields: (keyof Errors)[] = [
      "clientId",
      "openIdSecret",
      "username",
      "password",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = `${field} er påkrevd`;
      }
    });

    if (formData.username && !validateUsername(formData.username)) {
      newErrors.username = "Brukernavn inneholder ugyldige tegn";
    }

    if (formData.clientId && !validateClientId(formData.clientId)) {
      newErrors.clientId = "Client ID inneholder ugyldige tegn";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const sendFormData = new FormData();
      sendFormData.append("clientId", formData.clientId);
      sendFormData.append("openIdSecret", formData.openIdSecret);
      sendFormData.append("username", formData.username);
      sendFormData.append("password", formData.password);

      onSubmit(sendFormData);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <VStack gap={"3"}>
        <ReadMore header="Fyll ut med JSON " size="medium" defaultOpen={false}>
          <Textarea
            label="Importer JSON med tilgangsinformasjon"
            value={jsonInput}
            onChange={handleJsonChange}
            description="Innholdet valideres og brukes kun i nettleseren – ikke sendt til server."
            minRows={6}
          />
          {jsonError && <p style={{ color: "red" }}>{jsonError}</p>}
        </ReadMore>

        <TextField
          label="Client ID"
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
          autoComplete="off"
          error={errors?.clientId}
        />
        <TextField
          label="Client Secret"
          name="openIdSecret"
          value={formData.openIdSecret}
          onChange={handleChange}
          autoComplete="off"
          error={errors?.openIdSecret}
        />
        <TextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          autoComplete="off"
          error={errors?.username}
        />
        <TextField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          type="password"
          autoComplete="off"
          error={errors?.password}
        />

        <HGrid gap={"6"} columns={3}>
          {isLoading && <Button loading>Lagre</Button>}
          {!isLoading && <Button type="submit">Logg inn</Button>}
        </HGrid>
      </VStack>
    </Form>
  );
}
