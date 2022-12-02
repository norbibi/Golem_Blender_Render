import React, { useState, useEffect, useRef } from "react";
import Form from 'react-bootstrap/Form';
import ToggleButton from 'react-bootstrap/ToggleButton';
import InputRange from 'react-input-range';

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormControl = ({ setState, state, label, type }: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<Form.Control type={type} value={state} onChange={e => setState(e.target.value)}/>
	</Form.Group>
);

export function useFormControl(type: any, label: any, defaultValue: any) {
	const [state, setState] = useState(defaultValue);
	return [
		state,
		<FormControl state={state} setState={setState} label={label} type={type}/>
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormToggleButton = ({ setState, state, id, label }: any) => (
	<ToggleButton id={id} className="mb-2" type="checkbox" variant="outline-primary" value="1" checked={state} onChange={e => {setState(e.currentTarget.checked)}}>{label}</ToggleButton>
);

export function useFormToggleButton(id: any, label: any, defaultValue: any) {
	const [state, setState] = useState(defaultValue);
	return [
		state,
		<FormToggleButton state={state} setState={setState} id={id} label={label}/>
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormInputDirectory = ({ setState, state, label}: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<div>
			<input type="file" webkitdirectory="true" onChange={e => {if (e.target.files) setState(Array.from(e.target.files))}} />
		</div>
	</Form.Group>
);

export function useFormInputDirectory(label: any, cb: any) {
	const [state, setState] = useState([]);

	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
    		isFirstRender.current = false;
    		return
  		}
		cb(state)
	}, [state])

	return [
		state,
		<FormInputDirectory state={state} setState={setState} label={label} />
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormInputRange = ({ setState, state, label, min, max}: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<InputRange minValue={min} maxValue={max} value={state} onChange={value => setState(value)}/>
	</Form.Group>
);

export function useFormInputRange(label: any, min: any, max: any) {
	const [state, setState] = useState({min: min, max: max});

	useEffect(() => {
		setState({min: min, max: max})
	}, [min, max]);

	return [
		state,
		<FormInputRange state={state} setState={setState} label={label} min={min} max={max} />
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormInputRangeValue = ({ setState, state, label, min, max}: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<InputRange minValue={min} maxValue={max} value={state} onChange={value => setState(value)}/>
	</Form.Group>
);

export function useFormInputRangeValue(label: any, min: any, max: any, init: any) {
	const [state, setState] = useState(init);

	return [
		state,
		<FormInputRangeValue state={state} setState={setState} label={label} min={min} max={max} init={init}/>
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormSelect = ({ setState, state, label, files }: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<Form.Select aria-label="Default select example" onChange={e => setState(files[e.target.value])}>
			<option key={0} value="">Select Blend file</option>
			{files.map((file: File, index: number) => {
				if ((file as File).webkitRelativePath.includes('.blend'))
					return (
						<option key={index+1} value={index}>{(file as File).webkitRelativePath}</option>
					)
			})}
		</Form.Select>
	</Form.Group>
);

export function useFormSelect(label: any, files: any, cb: any) {
	const [state, setState] = useState(files);

	const isFirstRender = useRef(true);
	useEffect(() => {
		if (isFirstRender.current) {
    		isFirstRender.current = false;
    		return
  		}
		cb(state)
	}, [state])

	return [
		state,
		<FormSelect state={state} setState={setState} label={label} files={files} />
	];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const FormListSelect = ({ setState, state, label, items, init}: any) => (
	<Form.Group className="mb-3">
		<Form.Label>{label}</Form.Label>
		<Form.Select aria-label="Default select example" defaultValue={init} onChange={e => setState(e.target.value)}>
			{items.map((item: any, index: number) => {
				return (
					<option key={index} value={index}>{item}</option>
				)
			})}
		</Form.Select>
	</Form.Group>
);

export function useFormListSelect(label: any, items: any, init: any) {
	const [state, setState] = useState(init);

	return [
		state,
		<FormListSelect state={state} setState={setState} label={label} items={items} init={init} />
	];
}
