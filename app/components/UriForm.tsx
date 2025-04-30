import { useState } from "react";
import { Button, HStack, Label, TextField } from "@navikt/ds-react";
import { useNavigate } from "react-router";

export function UriForm() {
  const [formError, setFormError] = useState<{ error?: string } | null>(null);
  const [inputURI, setInputURI] = useState("");
  const navigate = useNavigate();

  function handleSubmit() {
    const validUriPattern = /^\/[a-zA-Z]+\/[a-zA-Z]+$/;

    if (!validUriPattern.test(inputURI)) {
      setFormError({ error: "URI må ha formatet /resource/entity" });
      return;
    }

    navigate(`/?${inputURI}`, {
      replace: true,
      state: { reload: true },
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputURI(e.target.value);
  };

  return (
    <HStack gap={"1"}>
      <Label>https://beta.felleskomponent.no</Label>
      <TextField
        size={"small"}
        label="URI"
        description="/resource/entity"
        name="uri"
        error={formError?.error}
        hideLabel={true}
        onChange={handleChange}
      />
      <Button type="submit" size={"small"} onClick={handleSubmit}>
        FINT!
      </Button>
    </HStack>
    // </Form>
  );
}
