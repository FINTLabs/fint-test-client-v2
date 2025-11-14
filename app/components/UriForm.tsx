import { useState } from "react";
import { Button, HStack, Label, TextField } from "@navikt/ds-react";
import { useNavigate } from "react-router";
import { validateUriPath } from "~/utils/validation";

export function UriForm() {
  const [formError, setFormError] = useState<{ error?: string } | null>(null);
  const [inputURI, setInputURI] = useState("");
  const navigate = useNavigate();

  function handleSubmit() {
    setFormError(null);

    if (!validateUriPath(inputURI)) {
      setFormError({
        error:
          "URI må ha formatet /resource/entity og inneholde kun gyldige tegn",
      });
      navigate("/", {
        replace: true,
        state: { reload: true },
      });
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

  // TODO: get server from url
  return (
    <HStack gap={"1"} className="w-full px-32">
      <Label>https://beta.felleskomponent.no</Label>
      <TextField
        size={"small"}
        label="URI"
        description="/resource/entity"
        name="uri"
        error={formError?.error}
        hideLabel={true}
        onChange={handleChange}
        className="flex-1"
      />
      <Button type="submit" size={"small"} onClick={handleSubmit}>
        FINT!
      </Button>
    </HStack>
  );
}
