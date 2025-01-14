import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import { WidgetType } from "../models";
import BackendService from "../services/BackendService";
import { useDashboard } from "../hooks";
import StorageService from "../services/StorageService";
import Breadcrumbs from "../components/Breadcrumbs";
import TextField from "../components/TextField";
import FileInput from "../components/FileInput";
import Button from "../components/Button";
import ImageWidget from "../components/ImageWidget";
import Link from "../components/Link";

interface FormValues {
  title: string;
  summary: string;
  showTitle: boolean;
  summaryBelow: boolean;
}

interface PathParams {
  dashboardId: string;
}

function AddImage() {
  const history = useHistory();
  const { dashboardId } = useParams<PathParams>();
  const { dashboard, loading } = useDashboard(dashboardId);
  const { register, errors, handleSubmit } = useForm<FormValues>();
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [summary, setSummary] = useState("");
  const [showTitle, setShowTitle] = useState(true);
  const [summaryBelow, setSummaryBelow] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const supportedImageFileTypes = Object.values(StorageService.imageFileTypes);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!imageFile) {
        throw new Error("Image file not specified");
      }
      setImageUploading(true);
      const s3Key = await StorageService.uploadImage(imageFile);

      await BackendService.createWidget(
        dashboardId,
        values.title,
        WidgetType.Image,
        values.showTitle,
        {
          title: title,
          s3Key: {
            raw: s3Key,
          },
          fileName: imageFile.name,
          imageAltText: altText,
          summary: summary,
          summaryBelow: summaryBelow,
        }
      );
      setImageUploading(false);

      history.push(`/admin/dashboard/edit/${dashboardId}`, {
        alert: {
          type: "success",
          message: `"${values.title}" image has been successfully added`,
        },
      });
    } catch (err) {
      console.log("Failed to save content item", err);
      setImageUploading(false);
    }
  };

  const goBack = () => {
    history.push(`/admin/dashboard/${dashboardId}/add-content`);
  };

  const onCancel = () => {
    history.push(`/admin/dashboard/edit/${dashboardId}`);
  };

  const handleChangeTitle = (event: React.FormEvent<HTMLInputElement>) => {
    setTitle((event.target as HTMLInputElement).value);
  };

  const handleAltTextChange = (event: React.FormEvent<HTMLInputElement>) => {
    setAltText((event.target as HTMLInputElement).value);
  };

  const handleSummaryChange = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setSummary((event.target as HTMLTextAreaElement).value);
  };

  const handleSummaryBelowChange = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    setSummaryBelow((event.target as HTMLInputElement).checked);
  };

  const handleShowTitleChange = (event: React.FormEvent<HTMLInputElement>) => {
    setShowTitle((event.target as HTMLInputElement).checked);
  };

  const onFileProcessed = (data: File) => {
    if (data) {
      setImageFile(data);
    }
  };

  const crumbs = [
    {
      label: "Dashboards",
      url: "/admin/dashboards",
    },
    {
      label: dashboard?.name,
      url: `/admin/dashboard/edit/${dashboardId}`,
    },
  ];

  if (!loading) {
    crumbs.push({
      label: "Add image",
      url: "",
    });
  }

  return (
    <>
      <Breadcrumbs crumbs={crumbs} />
      <h1>Add Image</h1>

      <div className="text-base text-italic">Step 2 of 2</div>
      <div className="margin-y-1 text-semibold display-inline-block font-sans-lg">
        Configure image
      </div>

      <div className="grid-row width-desktop">
        <div className="grid-col-6">
          <form
            className="usa-form usa-form--large"
            onSubmit={handleSubmit(onSubmit)}
          >
            <fieldset className="usa-fieldset">
              <TextField
                id="title"
                name="title"
                label="Image title"
                hint="Give your image a descriptive title."
                error={errors.title && "Please specify an image title"}
                onChange={handleChangeTitle}
                required
                register={register}
              />

              <div className="usa-checkbox">
                <input
                  className="usa-checkbox__input"
                  id="display-title"
                  type="checkbox"
                  name="showTitle"
                  defaultChecked={true}
                  onChange={handleShowTitleChange}
                  ref={register()}
                />
                <label className="usa-checkbox__label" htmlFor="display-title">
                  Show title on dashboard
                </label>
              </div>

              <div>
                <FileInput
                  id="dataset"
                  name="dataset"
                  label="File upload"
                  accept={supportedImageFileTypes.toString()}
                  loading={imageUploading}
                  register={register}
                  hint={<span>Must be a PNG, JPEG, or SVG file</span>}
                  fileName={imageFile && imageFile.name}
                  onFileProcessed={onFileProcessed}
                />
              </div>

              <div>
                {false && false ? (
                  <div className="usa-alert usa-alert--warning margin-top-3">
                    <div className="usa-alert__body">
                      <p className="usa-alert__text">
                        It is recommended that tables have less than 8 columns.
                        You can still continue.
                      </p>
                    </div>
                  </div>
                ) : (
                  ""
                )}

                <div hidden={!imageFile}>
                  <TextField
                    id="altText"
                    name="altText"
                    label="Image alt text"
                    hint="Provide a short description of the image for users with visual impairments using a screen reader. This description will not display on the dashboard."
                    register={register}
                    onChange={handleAltTextChange}
                    multiline
                    rows={1}
                  />

                  <TextField
                    id="summary"
                    name="summary"
                    label="Image description - optional"
                    hint={
                      <>
                        Give your chart a summary to explain it in more depth.
                        It can also be read by screen readers to describe the
                        chart for those with visual impairments. This field
                        supports markdown.{" "}
                        <Link target="_blank" to={"/admin/markdown"} external>
                          View Markdown Syntax
                        </Link>
                      </>
                    }
                    register={register}
                    onChange={handleSummaryChange}
                    multiline
                    rows={5}
                  />
                  <div className="usa-checkbox">
                    <input
                      className="usa-checkbox__input"
                      id="summary-below"
                      type="checkbox"
                      name="summaryBelow"
                      defaultChecked={false}
                      onChange={handleSummaryBelowChange}
                      ref={register()}
                    />
                    <label
                      className="usa-checkbox__label"
                      htmlFor="summary-below"
                    >
                      Show description below image
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
            <br />
            <hr />
            <Button variant="outline" type="button" onClick={goBack}>
              Back
            </Button>
            <Button
              disabled={!imageFile || !title || !altText || imageUploading}
              type="submit"
            >
              Add image
            </Button>
            <Button
              variant="unstyled"
              className="text-base-dark hover:text-base-darker active:text-base-darkest"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </form>
        </div>
        <div className="grid-col-6">
          <h4 className="margin-top-4">Preview</h4>
          <ImageWidget
            title={showTitle ? title : ""}
            summary={summary}
            file={imageFile}
            summaryBelow={summaryBelow}
            altText={altText}
          />
        </div>
      </div>
    </>
  );
}

export default AddImage;
